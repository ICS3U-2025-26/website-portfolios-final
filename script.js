const ORG = "ICS3U-2025-26";
const PREFIX = "website-portfolio-";

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
    // "coolgamer99":   "Jane S.",
};

const grid = document.getElementById("portfolioGrid");
const search = document.getElementById("search");
const totalCountEl = document.getElementById("totalCount");
const filteredCountEl = document.getElementById("filteredCount");

async function getRepos(page = 1, allRepos = []) {
    const url = `https://api.github.com/orgs/${ORG}/repos?per_page=100&page=${page}`;
    
    try {
    const response = await fetch(url);
    const repos = await response.json();

    if (!Array.isArray(repos)) {
        grid.innerHTML = `
        <div class="error">
            <p>Could not load repositories. Please check the organization name and repository visibility.</p>
        </div>
        `;
        return [];
    }

    allRepos = allRepos.concat(repos);

    if (repos.length === 100) {
        return getRepos(page + 1, allRepos);
    }

    return allRepos;
    } catch (error) {
    grid.innerHTML = `
        <div class="error">
        <p>Failed to fetch repositories. Please try again later.</p>
        </div>
    `;
    return [];
    }
}

function usernameFromRepo(repoName) {
    return repoName.replace(PREFIX, "");
}

function displayName(username) {
    return NAME_MAP[username] || username;
}

function siteUrl(repoName) {
    return `https://${ORG}.github.io/${repoName}/`;
}

function getInitials(username) {
    return username.slice(0, 2).toUpperCase();
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
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
    return 'Yesterday';
    } else if (diffDays < 7) {
    return `${diffDays} days ago`;
    } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    } else {
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
    }
}

function render(repos, total) {
    if (repos.length === 0) {
    grid.innerHTML = `
        <div class="empty" style="grid-column: 1 / -1;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
        </svg>
        <p>No portfolios found matching your search.</p>
        </div>
    `;
    filteredCountEl.textContent = "0";
    return;
    }

    filteredCountEl.textContent = repos.length;
    grid.innerHTML = "";

    repos.forEach((repo, index) => {
    const username = usernameFromRepo(repo.name);
    const lastPush = formatDate(repo.pushed_at);

    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = `${index * 0.05}s`;

    const label = displayName(username);
    card.innerHTML = `
        <div class="card-header">
        <div class="avatar">${getInitials(label)}</div>
        <a href="${siteUrl(repo.name)}" target="_blank" rel="noopener noreferrer" class="card-title">${label}</a>
        </div>
        <div class="card-links">
        <a href="${siteUrl(repo.name)}" target="_blank" rel="noopener noreferrer" class="card-link">
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
        Last updated: ${lastPush}
        </div>
    `;

    grid.appendChild(card);
    });
}

async function main() {
    const repos = await getRepos();

    const portfolioRepos = repos
    .filter(repo => repo.name.startsWith(PREFIX))
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));

    totalCountEl.textContent = portfolioRepos.length;
    render(portfolioRepos, portfolioRepos.length);

    search.addEventListener("input", () => {
    const query = search.value.toLowerCase().trim();

    const filtered = portfolioRepos.filter(repo => {
        const username = usernameFromRepo(repo.name);
        const label = displayName(username);
        return repo.name.toLowerCase().includes(query) || label.toLowerCase().includes(query);
    });

    render(filtered, portfolioRepos.length);
    });
}

main();
