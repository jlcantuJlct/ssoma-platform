async function testUrls() {
    const urls = [
        "https://script.google.com/macros/s/AKfycbzapkKUP2aYCoVrDk5nkJUy03u3K10LRCV2Hmt2KyKlEsdHgi4vXseSEbaIiKcudVzW/exec",
        "https://script.google.com/macros/s/AKfycbwxvAgdYNiYcklJs08N87wL4APgZ0fR-uTdP6m7naZGli3wzQ2oeLTgO52fqIg5pF5EwQ/exec"
    ];

    for (const url of urls) {
        try {
            const response = await fetch(url, { method: 'GET' });
            console.log(`URL ${url.substring(0, 50)}... status: ${response.status}`);
        } catch (err) {
            console.log(`URL ${url.substring(0, 50)}... error: ${err.message}`);
        }
    }
}

testUrls();
