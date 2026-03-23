import { Router } from 'express'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { reimbursementRequests, users } from '../../db/schema.js'
import {
  requireAuth,
  type AuthedRequest
} from '../../middleware/require-auth.js'

type CreateReimbursementRequestBody = {
  companyKey?: string
  divisionKey?: string
  amountSpent?: string | number | null
  purchaseDate?: string
  vendor?: string
  category?: string
  paymentMethod?: string
  purpose?: string
  tiedToJob?: boolean
  jobNumber?: string | null
  notes?: string | null
  receiptUploaded?: boolean
  urgentReimbursementNeeded?: boolean
}

type UpdateStatusBody = {
  status?: string
}

const VALID_STATUSES = [
  'submitted',
  'approved',
  'denied',
  'reimbursed'
] as const

function getSingleParam (value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function cleanString (value?: string | null) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function cleanDecimal (value?: string | number | null) {
  if (value === null || value === undefined) return null

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toFixed(2) : null
  }

  const trimmed = value.trim()
  if (!trimmed.length) return null

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed.toFixed(2) : null
}

function cleanDate (value?: string) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function isAdminUser (req: AuthedRequest) {
  return req.authUser?.role === 'admin'
}

const router = Router()

router.post('/', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const authUser = req.authUser

    if (!authUser?.sub) {
      return res.status(401).json({ error: 'Unauthorized.' })
    }

    const body = (req.body ?? {}) as CreateReimbursementRequestBody

    const companyKey = cleanString(body.companyKey)
    const divisionKey = cleanString(body.divisionKey)
    const amountSpent = cleanDecimal(body.amountSpent)
    const purchaseDate = cleanDate(body.purchaseDate)
    const vendor = cleanString(body.vendor)
    const category = cleanString(body.category)
    const paymentMethod = cleanString(body.paymentMethod)
    const purpose = cleanString(body.purpose)
    const tiedToJob = Boolean(body.tiedToJob)
    const jobNumber = cleanString(body.jobNumber)
    const notes = cleanString(body.notes)
    const receiptUploaded = Boolean(body.receiptUploaded)
    const urgentReimbursementNeeded = Boolean(body.urgentReimbursementNeeded)

    if (!companyKey) {
      return res.status(400).json({ error: 'companyKey is required.' })
    }

    if (!amountSpent) {
      return res.status(400).json({ error: 'amountSpent is required.' })
    }

    if (!purchaseDate) {
      return res.status(400).json({ error: 'purchaseDate is required.' })
    }

    if (!vendor) {
      return res.status(400).json({ error: 'vendor is required.' })
    }

    if (!category) {
      return res.status(400).json({ error: 'category is required.' })
    }

    if (!paymentMethod) {
      return res.status(400).json({ error: 'paymentMethod is required.' })
    }

    if (!purpose) {
      return res.status(400).json({ error: 'purpose is required.' })
    }

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.sub))
      .limit(1)

    const user = userRows[0]

    if (!user) {
      return res.status(404).json({ error: 'User not found.' })
    }

    const inserted = await db
      .insert(reimbursementRequests)
      .values({
        userId: user.id,
        companyKey,
        divisionKey,
        techNameSnapshot: user.fullName,
        amountSpent,
        purchaseDate,
        vendor,
        category,
        paymentMethod,
        purpose,
        tiedToJob,
        jobNumber: tiedToJob ? jobNumber : null,
        notes,
        receiptUploaded,
        urgentReimbursementNeeded,
        status: 'submitted'
      })
      .returning()

    return res.status(201).json({
      request: inserted[0]
    })
  } catch (error) {
    console.error('Create reimbursement request error:', error)
    return res.status(500).json({ error: 'Internal server error.' })
  }
})

router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const authUser = req.authUser

    if (!authUser?.sub) {
      return res.status(401).json({ error: 'Unauthorized.' })
    }

    if (!isAdminUser(req)) {
      return res.status(403).json({ error: 'Forbidden.' })
    }
    const divisionKey = cleanString(
      typeof req.query.divisionKey === 'string' ? req.query.divisionKey : ''
    )
    const status = cleanString(
      typeof req.query.status === 'string' ? req.query.status : ''
    )

    const filters = []

    if (divisionKey) {
      filters.push(eq(reimbursementRequests.divisionKey, divisionKey))
    }

    if (status) {
      filters.push(eq(reimbursementRequests.status, status))
    }

    const baseQuery = db
      .select({
        id: reimbursementRequests.id,
        userId: reimbursementRequests.userId,
        companyKey: reimbursementRequests.companyKey,
        divisionKey: reimbursementRequests.divisionKey,
        techNameSnapshot: reimbursementRequests.techNameSnapshot,
        amountSpent: reimbursementRequests.amountSpent,
        purchaseDate: reimbursementRequests.purchaseDate,
        vendor: reimbursementRequests.vendor,
        category: reimbursementRequests.category,
        paymentMethod: reimbursementRequests.paymentMethod,
        purpose: reimbursementRequests.purpose,
        tiedToJob: reimbursementRequests.tiedToJob,
        jobNumber: reimbursementRequests.jobNumber,
        notes: reimbursementRequests.notes,
        receiptUploaded: reimbursementRequests.receiptUploaded,
        urgentReimbursementNeeded:
          reimbursementRequests.urgentReimbursementNeeded,
        status: reimbursementRequests.status,
        reviewedAt: reimbursementRequests.reviewedAt,
        reviewedByUserId: reimbursementRequests.reviewedByUserId,
        reimbursementDate: reimbursementRequests.reimbursementDate,
        submittedAt: reimbursementRequests.submittedAt,
        createdAt: reimbursementRequests.createdAt,
        updatedAt: reimbursementRequests.updatedAt
      })
      .from(reimbursementRequests)

    const rows =
      filters.length > 0
        ? await baseQuery
            .where(and(...filters))
            .orderBy(desc(reimbursementRequests.submittedAt))
        : await baseQuery.orderBy(desc(reimbursementRequests.submittedAt))

    return res.json({ requests: rows })
  } catch (error) {
    console.error('List reimbursement requests error:', error)
    return res.status(500).json({ error: 'Internal server error.' })
  }
})

router.get('/:id', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const authUser = req.authUser

    if (!authUser?.sub) {
      return res.status(401).json({ error: 'Unauthorized.' })
    }

    const id = cleanString(getSingleParam(req.params.id))

    if (!id) {
      return res.status(400).json({ error: 'Request id is required.' })
    }

    const rows = await db
      .select()
      .from(reimbursementRequests)
      .where(eq(reimbursementRequests.id, id))
      .limit(1)

    const requestRow = rows[0]

    if (!requestRow) {
      return res.status(404).json({ error: 'Reimbursement request not found.' })
    }

    const canView = isAdminUser(req) || requestRow.userId === authUser.sub

    if (!canView) {
      return res.status(403).json({ error: 'Forbidden.' })
    }

    return res.json({ request: requestRow })
  } catch (error) {
    console.error('Get reimbursement request detail error:', error)
    return res.status(500).json({ error: 'Internal server error.' })
  }
})

router.patch('/:id/status', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const authUser = req.authUser
    const id = cleanString(getSingleParam(req.params.id))
    const body = (req.body ?? {}) as UpdateStatusBody
    const nextStatus = cleanString(body.status)

    if (!authUser?.sub) {
      return res.status(401).json({ error: 'Unauthorized.' })
    }

    if (!isAdminUser(req)) {
      return res.status(403).json({ error: 'Forbidden.' })
    }

    if (!id) {
      return res.status(400).json({ error: 'Request id is required.' })
    }

    if (
      !nextStatus ||
      !VALID_STATUSES.includes(nextStatus as typeof VALID_STATUSES[number])
    ) {
      return res.status(400).json({ error: 'Valid status is required.' })
    }

    const existingRows = await db
      .select()
      .from(reimbursementRequests)
      .where(eq(reimbursementRequests.id, id))
      .limit(1)

    const existing = existingRows[0]

    if (!existing) {
      return res.status(404).json({ error: 'Reimbursement request not found.' })
    }

    const updatedRows = await db
      .update(reimbursementRequests)
      .set({
        status: nextStatus,
        reviewedAt: nextStatus === 'submitted' ? null : new Date(),
        reviewedByUserId: nextStatus === 'submitted' ? null : authUser.sub,
        reimbursementDate:
          nextStatus === 'reimbursed'
            ? new Date().toISOString().slice(0, 10)
            : existing.reimbursementDate,
        updatedAt: new Date()
      })
      .where(eq(reimbursementRequests.id, id))
      .returning()

    return res.json({ request: updatedRows[0] })
  } catch (error) {
    console.error('Update reimbursement request status error:', error)
    return res.status(500).json({ error: 'Internal server error.' })
  }
})

export default router
