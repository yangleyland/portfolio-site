import React from 'react';

export async function GitHubStats({ username }: { username: string }) {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN not found');
    }

    // Get date range for last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query = `
      query($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              totalContributions
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          username,
          from: thirtyDaysAgo.toISOString(),
          to: today.toISOString(),
        },
      }),
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub data');
    }

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error('GraphQL query failed');
    }

    const totalContributions = result.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions ?? 0;

    return (
      <span className="text-gray-800 dark:text-zinc-300">
        {totalContributions} {totalContributions === 1 ? 'contribution' : 'contributions'} in the last month
      </span>
    );
  } catch (error) {
    console.error('GitHub Stats Error:', error);
    return (
      <span className="text-gray-800 dark:text-zinc-300">
        0 contributions in the last month
      </span>
    );
  }
}
