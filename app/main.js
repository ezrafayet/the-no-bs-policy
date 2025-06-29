// Simple markdown to HTML converter
function markdownToHtml(markdown) {
    return markdown
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-6">$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
        .replace(/^\d+\. \*\*(.*)\*\*: (.*$)/gim, '<li class="ml-4 mb-2"><strong>$1</strong>: $2</li>')
        .replace(/\n\n/g, '</p><p class="mb-4">')
        .replace(/^<p/, '<p class="mb-4">')
        .replace(/---/g, '<hr class="my-8 border-gray-300">')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

// Global policies cache
let policiesCache = null;

// Load policies data (works for both dev and production)
async function loadPoliciesData() {
    if (policiesCache) {
        return policiesCache;
    }
    
    try {
        // Try to load from static file first (production)
        const response = await fetch('/policies-data.json');
        if (response.ok) {
            policiesCache = await response.json();
            return policiesCache;
        }
    } catch (error) {
        // Fall back to API (development)
        console.log('Using development API for policies');
    }
    
    try {
        const response = await fetch('/api/policies');
        const policies = await response.json();
        
        // For dev API, we need to fetch full content for each policy
        const fullPolicies = [];
        for (const policy of policies) {
            const fullResponse = await fetch(`/api/policies/${policy.version}`);
            const fullPolicy = await fullResponse.json();
            fullPolicies.push(fullPolicy);
        }
        
        policiesCache = fullPolicies;
        return policiesCache;
    } catch (error) {
        console.error('Error loading policies:', error);
        return [];
    }
}

// Get all policy files and find the latest
async function getLatestPolicy() {
    const policies = await loadPoliciesData();
    
    if (policies.length === 0) {
        return null;
    }
    
    // Sort by version and get the latest
    const sortedPolicies = policies.sort((a, b) => {
        const versionA = a.version.split('.').map(Number);
        const versionB = b.version.split('.').map(Number);
        
        for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
            const aVal = versionA[i] || 0;
            const bVal = versionB[i] || 0;
            if (aVal !== bVal) {
                return bVal - aVal; // Descending order
            }
        }
        return 0;
    });
    
    return sortedPolicies[0];
}

// Load and display a policy
async function loadPolicy(version) {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="text-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>';
    
    try {
        const policies = await loadPoliciesData();
        const policy = policies.find(p => p.version === version);
        
        if (!policy) {
            content.innerHTML = '<div class="text-center py-8 text-red-600">Policy not found</div>';
            return;
        }
        
        const html = markdownToHtml(policy.content);
        content.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm p-8">
                <div class="prose max-w-none">
                    ${html}
                </div>
                <div class="mt-8 pt-6 border-t border-gray-200">
                    <p class="text-sm text-gray-500">Version ${policy.version} • Last updated ${new Date(policy.lastModified).toLocaleDateString()}</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading policy:', error);
        content.innerHTML = '<div class="text-center py-8 text-red-600">Error loading policy</div>';
    }
}

// Handle navigation
function handleNavigation() {
    const path = window.location.pathname;
    
    if (path === '/' || path === '') {
        // Show latest policy
        getLatestPolicy().then(latest => {
            if (latest) {
                loadPolicy(latest.version);
            } else {
                document.getElementById('content').innerHTML = '<div class="text-center py-8 text-gray-600">No policies found</div>';
            }
        });
    } else if (path.startsWith('/policy/')) {
        // Show specific policy version
        const version = path.replace('/policy/', '');
        loadPolicy(version);
    } else if (path === '/policies') {
        // Show all policies list
        showAllPolicies();
    }
}

// Show all policies
async function showAllPolicies() {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="text-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>';
    
    try {
        const policies = await loadPoliciesData();
        
        if (policies.length === 0) {
            content.innerHTML = '<div class="text-center py-8 text-gray-600">No policies found</div>';
            return;
        }
        
        // Sort by version (newest first)
        const sortedPolicies = policies.sort((a, b) => {
            const versionA = a.version.split('.').map(Number);
            const versionB = b.version.split('.').map(Number);
            
            for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
                const aVal = versionA[i] || 0;
                const bVal = versionB[i] || 0;
                if (aVal !== bVal) {
                    return bVal - aVal;
                }
            }
            return 0;
        });
        
        const policiesList = sortedPolicies.map(policy => `
            <div class="bg-white rounded-lg shadow-sm p-6 mb-4 hover:shadow-md transition-shadow">
                <h3 class="text-xl font-semibold mb-2">
                    <a href="/policy/${policy.version}" class="text-blue-600 hover:text-blue-800">
                        Version ${policy.version}
                    </a>
                </h3>
                <p class="text-gray-600 mb-3">${policy.content.split('\n')[0].replace('# ', '')}</p>
                <p class="text-sm text-gray-500">Last updated: ${new Date(policy.lastModified).toLocaleDateString()}</p>
            </div>
        `).join('');
        
        content.innerHTML = `
            <div class="mb-6">
                <h2 class="text-2xl font-bold mb-4">All Policy Versions</h2>
                <p class="text-gray-600">Click on a version to view the full policy.</p>
            </div>
            ${policiesList}
        `;
    } catch (error) {
        console.error('Error fetching policies:', error);
        content.innerHTML = '<div class="text-center py-8 text-red-600">Error loading policies</div>';
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Create the app structure
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50 flex flex-col">
            <header class="bg-white shadow-sm border-b">
                <div class="max-w-4xl mx-auto px-4 py-6">
                    <h1 class="text-3xl font-bold text-gray-900 mb-4">The No BS Policy</h1>
                    <nav class="flex space-x-6">
                        <a href="/" class="nav-link text-blue-600 hover:text-blue-800 font-medium">Latest</a>
                        <a href="/policies" class="nav-link text-gray-600 hover:text-gray-800 font-medium">All Versions</a>
                    </nav>
                </div>
            </header>

            <main id="content" class="flex-1 max-w-4xl mx-auto px-4 py-8">
                <!-- Content will be loaded here -->
            </main>

            <footer class="bg-white border-t mt-auto">
                <div class="max-w-4xl mx-auto px-4 py-6">
                    <p class="text-center text-gray-600">&copy; 2024 The No BS Policy. No bullshit, just policies.</p>
                </div>
            </footer>
        </div>
    `;
    
    // Handle navigation
    handleNavigation();
    
    // Handle browser back/forward
    window.addEventListener('popstate', handleNavigation);
    
    // Handle navigation clicks
    document.addEventListener('click', (e) => {
        if (e.target.matches('a[href^="/"]')) {
            e.preventDefault();
            const href = e.target.getAttribute('href');
            window.history.pushState({}, '', href);
            handleNavigation();
        }
    });
    
    // Hide loading overlay after a short delay to ensure everything is rendered
    setTimeout(() => {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }, 100);
}); 