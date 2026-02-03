export interface CommitInput {
  owner: string;
  repo: string;
  path: string;
  message: string;
  contentBase64: string;
  branch?: string;
  accessToken: string;
}

export async function commitSolution(input: CommitInput) {
  const url = `https://api.github.com/repos/${input.owner}/${input.repo}/contents/${encodeURIComponent(
    input.path
  )}`;

  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: input.message,
      content: input.contentBase64,
      branch: input.branch
    })
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub commit failed: ${text}`);
  }

  const data = (await resp.json()) as { content?: { html_url?: string } };
  return { commitUrl: data.content?.html_url };
}
