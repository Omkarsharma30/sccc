const fs = require('fs');
const path = require('path');

// Build configuration
const config = {
    sourceDir: '.',
    buildDir: 'build',
    routes: {
        'index.html': '',           // Homepage: /
        'courses.html': 'courses',  // Courses: /courses/
        'results.html': 'results',  // Results: /results/
        'admission.html': 'admission', // Admission: /admission/
        'contact.html': 'contact',  // Contact: /contact/
        'admission-success.html': 'admission/success',
        'contact-success.html': 'contact/success'
    },
    copyDirs: ['css', 'js', 'Certificate pdf', 'LOGO'],
    updatePaths: true
};

// Helper function to ensure directory exists
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Helper function to copy directory recursively
function copyDir(src, dest) {
    ensureDir(dest);
    const items = fs.readdirSync(src);
    
    items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (fs.statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

// Function to update HTML links to use clean URLs
function updateHtmlLinks(content) {
    if (!config.updatePaths) return content;
    
    // Update navigation links
    content = content.replace(/href="index\.html"/g, 'href="/"');
    content = content.replace(/href="courses\.html"/g, 'href="/courses/"');
    content = content.replace(/href="results\.html"/g, 'href="/results/"');
    content = content.replace(/href="admission\.html"/g, 'href="/admission/"');
    content = content.replace(/href="contact\.html"/g, 'href="/contact/"');
    content = content.replace(/href="admission-success\.html"/g, 'href="/admission/success/"');
    content = content.replace(/href="contact-success\.html"/g, 'href="/contact/success/"');
    
    // Update form actions
    content = content.replace(/action="contact-success\.html"/g, 'action="/contact/success/"');
    content = content.replace(/action="admission-success\.html"/g, 'action="/admission/success/"');
    
    // Update course links with anchors
    content = content.replace(/href="courses\.html#([^"]+)"/g, 'href="/courses/#$1"');
    
    return content;
}

// Main build function
function build() {
    console.log('🚀 Starting clean URL build process...');
    
    // Clean build directory
    if (fs.existsSync(config.buildDir)) {
        fs.rmSync(config.buildDir, { recursive: true });
        console.log('🧹 Cleaned build directory');
    }
    
    ensureDir(config.buildDir);
    
    // Copy static assets
    config.copyDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            const destDir = path.join(config.buildDir, dir);
            copyDir(dir, destDir);
            console.log(`📁 Copied ${dir}/ to build/`);
        }
    });
    
    // Process HTML files
    Object.entries(config.routes).forEach(([sourceFile, route]) => {
        if (fs.existsSync(sourceFile)) {
            let content = fs.readFileSync(sourceFile, 'utf8');
            
            // Update links to use clean URLs
            content = updateHtmlLinks(content);
            
            // Determine output path
            let outputPath;
            if (route === '') {
                // Homepage goes to build/index.html
                outputPath = path.join(config.buildDir, 'index.html');
            } else {
                // Other pages go to build/route/index.html
                const routeDir = path.join(config.buildDir, route);
                ensureDir(routeDir);
                outputPath = path.join(routeDir, 'index.html');
            }
            
            fs.writeFileSync(outputPath, content);
            console.log(`✅ Built ${sourceFile} → /${route}${route ? '/' : ''}`);
        } else {
            console.log(`⚠️  Warning: ${sourceFile} not found`);
        }
    });
    
    // Create .htaccess for Apache servers
    const htaccessContent = `# Enable clean URLs
RewriteEngine On

# Remove .html extension from URLs
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^([^\.]+)$ $1.html [NC,L]

# Redirect .html extension to clean URLs
RewriteCond %{THE_REQUEST} \s/+(.+?)\.html[\s?] [NC]
RewriteRule ^ /%1? [R=301,L]

# Handle trailing slashes
RewriteRule ^([^/]+)/$ /$1 [R=301,L]
RewriteRule ^([^/]+)$ /$1/ [R=301,L]
`;
    
    fs.writeFileSync(path.join(config.buildDir, '.htaccess'), htaccessContent);
    console.log('📝 Created .htaccess for Apache servers');
    
    // Create _redirects for Netlify
    const redirectsContent = `# Netlify redirects for clean URLs
/courses   /courses/   200
/results   /results/   200
/admission /admission/ 200
/contact   /contact/   200

# Handle .html extensions
/courses.html   /courses/   301!
/results.html   /results/   301!
/admission.html /admission/ 301!
/contact.html   /contact/   301!
/index.html     /           301!
`;
    
    fs.writeFileSync(path.join(config.buildDir, '_redirects'), redirectsContent);
    console.log('📝 Created _redirects for Netlify');
    
    // Create netlify.toml
    const netlifyToml = `[build]
  publish = "."

[[redirects]]
  from = "/courses.html"
  to = "/courses/"
  status = 301

[[redirects]]
  from = "/results.html"
  to = "/results/"
  status = 301

[[redirects]]
  from = "/admission.html"
  to = "/admission/"
  status = 301

[[redirects]]
  from = "/contact.html"
  to = "/contact/"
  status = 301

[[redirects]]
  from = "/index.html"
  to = "/"
  status = 301
`;
    
    fs.writeFileSync(path.join(config.buildDir, 'netlify.toml'), netlifyToml);
    console.log('📝 Created netlify.toml for Netlify deployment');
    
    console.log('\n🎉 Build completed successfully!');
    console.log('\n📋 Clean URL structure:');
    console.log('   Homepage: /');
    console.log('   Courses: /courses/');
    console.log('   Results: /results/');
    console.log('   Admission: /admission/');
    console.log('   Contact: /contact/');
    console.log('\n🚀 Deploy the build/ folder to your web server');
}

// Run build
if (require.main === module) {
    build();
}

module.exports = { build, config };
