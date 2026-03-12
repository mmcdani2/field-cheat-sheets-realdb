import { API_BASE, getStoredToken } from "./auth";

export type Company = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

async function parseJson(res: Response) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Request failed.");
  }
  return data;
}

export async function getCompany(): Promise<Company> {
  const token = getStoredToken();

  const res = await fetch(`${API_BASE}/api/company`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await parseJson(res);
  return data.company;
}

export async function updateCompanyName(name: string): Promise<Company> {
  const token = getStoredToken();

  const res = await fetch(`${API_BASE}/api/company`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  const data = await parseJson(res);
  return data.company;
}
