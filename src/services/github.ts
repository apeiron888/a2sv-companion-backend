import axios from "axios";
import { env } from "../config/env.js";

const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Accept: "application/vnd.github+json"
  }
});

export async function exchangeGitHubCode(code: string) {
  const response = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.GITHUB_CALLBACK_URL
    },
    {
      headers: { Accept: "application/json" }
    }
  );

  if (!response.data.access_token) {
    throw new Error("Failed to fetch GitHub access token");
  }

  return response.data.access_token as string;
}

export async function fetchGitHubUser(accessToken: string) {
  const response = await githubApi.get("/user", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.data as { login: string };
}

export async function verifyRepoAccess(accessToken: string, repoFullName: string) {
  const response = await githubApi.get(`/repos/${repoFullName}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.status === 200;
}

export async function upsertRepoFile(params: {
  accessToken: string;
  repoFullName: string;
  path: string;
  content: string;
  message: string;
}) {
  const { accessToken, repoFullName, path, content, message } = params;
  const headers = { Authorization: `Bearer ${accessToken}` };

  let sha: string | undefined;
  try {
    const existing = await githubApi.get(`/repos/${repoFullName}/contents/${path}`, { headers });
    sha = existing.data?.sha;
  } catch (error: any) {
    if (error?.response?.status !== 404) {
      throw error;
    }
  }

  const encodedContent = Buffer.from(content, "utf-8").toString("base64");
  const response = await githubApi.put(
    `/repos/${repoFullName}/contents/${path}`,
    {
      message,
      content: encodedContent,
      sha
    },
    { headers }
  );

  return response.data?.commit?.html_url as string | undefined;
}
