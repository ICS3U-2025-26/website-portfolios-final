const CLASSROOMS = [
    {
        label: "ICS3U",
        org: "ICS3U-2025-26",
        prefix: "website-portfolio-"
    },
    {
        label: "ICS4U",
        org: "ICS4U-2025-26",
        prefix: "website-portfolio-"
    }
];

// ─────────────────────────────────────────────────────────────────────────
// STUDENT NAME OVERRIDES
// Map a GitHub username to a display name shown on the card.
// Add as many entries as you need. Usernames not listed here will fall
// back to showing their GitHub username.
//
// Format:  "github-username": "Display Name",
// Example: "ghostrecon211":   "John D.",
// ─────────────────────────────────────────────────────────────────────────
const NAME_MAP = {
    "rongfeng1203": "Rina F.",
    // "coolgamer99": "Jane S.",
};

const grid = document.getElementById("portfolioGrid");
const search = document.getElementById("search");
const totalCountEl = document.getElementById("totalCount");
const filteredCountEl = document.getElementById("filteredCount");

let allPortfolios = [];

async function getReposForOrg(org, page = 1, allRepos = []) {
    const url = `https://api.github.com/orgs/${org}/repos?per_page=100&page=${page}`;

    try {
        const response = await fetch(url);
        const repos = await response.json();

        if (!Array.isArray(repos)) {
            console.error(`Could not load repositories for ${org}`, repos);
            return allRepos;
        }

        allRepos = allRepos.concat(repos);

        if (repos.length === 100) {
            return getReposForOrg(org, page + 1, allRepos);
        }

        return allRepos;
    } catch (error) {
        console.error(`Failed to fetch repositories for ${org}`, error);
        return allRepos;
    }
}

function usernameFromRepo(repoName, prefix) {
    return repoName.replace(prefix, "");
}

function displayName(username) {
    return NAME_MAP[username] || username;
}

function siteUrl(org, repoName) {
    return `https://${org}.github.io/${repoName}/`;
}

function getInitials(name) {
    const parts = name.trim().split(/\s+/);

    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    return name.slice(0, 2).toUpperCase();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours === 0) {
            const diffMins = Math.floor(diffMs / (1000 * 60));
            return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
        }
        return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else if (diffDays === 1) {
        return "Yesterday";
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
    } else {
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
        });
    }
}

function render(portfolios) {
    totalCountEl.textContent = allPortfolios.length;
    filteredCountEl.textContent = portfolios.length;

    if (portfolios.length === 0) {
        grid.innerHTML = `
            <div class="empty" style="grid-column: 1 / -1;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.3-4.3"/>
                </svg>
                <p>No portfolios found matching your search.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = "";

    portfolios.forEach((portfolio, index) => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.animationDelay = `${index * 0.05}s`;

        card.innerHTML = `
            <div class="course-label">${portfolio.label}</div>

            <div class="card-header">
                <div class="avatar">${getInitials(portfolio.displayName)}</div>
                <a href="${portfolio.siteUrl}" target="_blank" rel="noopener noreferrer" class="card-title">${portfolio.displayName}</a>
            </div>

            <div class="card-links">
                <a href="${portfolio.siteUrl}" target="_blank" rel="noopener noreferrer" class="card-link">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" x2="21" y1="14" y2="3"/>
                    </svg>
                    View Portfolio
                </a>
            </div>

            <div class="card-meta">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                Last updated: ${portfolio.lastPush}
            </div>
        `;

        grid.appendChild(card);
    });
}

function applySearch() {
    const query = search.value.toLowerCase().trim();

    const filtered = allPortfolios.filter(portfolio =>
        portfolio.username.toLowerCase().includes(query) ||
        portfolio.displayName.toLowerCase().includes(query) ||
        portfolio.label.toLowerCase().includes(query) ||
        portfolio.repoName.toLowerCase().includes(query)
    );

    render(filtered);
}

async function main() {
    const classroomResults = await Promise.all(
        CLASSROOMS.map(async classroom => {
            const repos = await getReposForOrg(classroom.org);

            return repos
                .filter(repo => repo.name.startsWith(classroom.prefix))
                .map(repo => {
                    const username = usernameFromRepo(repo.name, classroom.prefix);

                    return {
                        label: classroom.label,
                        org: classroom.org,
                        repoName: repo.name,
                        username,
                        displayName: displayName(username),
                        siteUrl: siteUrl(classroom.org, repo.name),
                        pushedAt: repo.pushed_at,
                        lastPush: formatDate(repo.pushed_at)
                    };
                });
        })
    );

    allPortfolios = classroomResults
        .flat()
        .sort((a, b) => {
            if (a.label !== b.label) return a.label.localeCompare(b.label);
            return a.displayName.localeCompare(b.displayName);
        });

    if (allPortfolios.length === 0) {
        grid.innerHTML = `
            <div class="error" style="grid-column: 1 / -1;">
                <p>No repositories were found. Check your organization names, repo visibility, and prefixes in script.js.</p>
            </div>
        `;
        totalCountEl.textContent = "0";
        filteredCountEl.textContent = "0";
        return;
    }

    render(allPortfolios);
    search.addEventListener("input", applySearch);
}

main();
