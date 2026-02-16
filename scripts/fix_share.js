const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// HARDCODED CREDENTIALS (Fallback)
const HARDCODED_EMAIL = "robot-ssoma@ssoma-app-485301.iam.gserviceaccount.com";
const HARDCODED_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCVfr4oqHgwMWZS\nKEKrs4xOk3SdRnU4fTAvnbNkOqiHQYV2opH9t1LYUZZjtLeclds5a3HFRl9dSKhb\n5nrQxwr8REH9Aa49UwrXStTX2F8K6NQsU94pVlcrQee174M7r1tSUAMGPcvb74r2\nw4eh8NawLcL1RYRKRVpYJWEgxSa1NxKBCZ0jiE4sRBjPM48ZDcBOeRxTWD2HB1ql\nKe8W+f5QsY8l7gAYiE6iyMyFjhsYjCcJ3RU8XrSYQvLG0nPqtYppUFKCPr7i3BGx\nNUmXVQJ8aKsInvkCKfNkE7K1HyNIK8/SqrRNiAAXZE2eydwDvVrWDvTWzwWpul+J\niCrzqWdXAgMBAAECggEAFMujLyu0QFv21FHmaFUbHOkVLTWaY8fCVrVUuYoRXHNI\nWgbmUQlZ3F6JEYiXjBAqhTPFiUAvTt4nEVWf2v/9LrdeCJBdyQkOtoEh136xRea6\ncQofmtd4W7uYvG27byeHCA26Rfl9rLQHPClZ6jSC4NIUzyKi8uPv29gjSTgzmLyA\nhDUWQA/ucYvBTRSxDK5YmKrH1QyQ5XwoV08phF5m6vv9ZwwJ2RHYPsjPGTEtZ8Yv\nOjw0+LsmfOa2CyQ58hkAfFgqSumMsbx8mqFt3fGU9U84DcYcGGm6c5VF/Yd9hyDP\nMYIMCe9f93zQPdsGSB27upYrCK6RCO/fLy5PD3XwrQKBgQDIrSeK/2nwOoJneTrE\nxdzE7YRYpDzxqRO4imE9vBrboa2GX2L4a8Lz7jfEi7omU6CU1y9BrZ1khXGTS97w\n2wCGri8V4K4LP9OKeWC4+b+Zvsc6RovoP2ZE9jWYeWEq5wLiLAZqW7zUy/v5ZLQE\nAlLrlf3MZyhS52Z4FzPwkfmzkwKBgQC+tXDAWeN3jgkbXC2M/+8qnEtsFxt3ZBtf\nZjWU4UiLF4HwO1VbL0H3/0Y9pxDOCGyd91TuKoRJZyAV3sV8HcNY+ZsP7I9Sn4g7\nFlteGfvSuKfDNDgNQAKoHcKmulh4U7pLXLnW9BlD11dRzqPflVweHYtc5UPyDa+D\nyStn1krfrQKBgGb/YI1Z/KC9FxNOyJgYSfCVS9lHKrSKKEIOXEyYUFysBeky6hRB\nEwWqHdt2L+vd/kyGiY23M1JVn26PgXSzovh9TFN5Rzsk3klzdO5b2ThrD8xcSxDA\nAZihme6RVgr0GKnHGN/cB/ZcYA6n3jE0lCSwjlwsEilC9XfryM/PzI6bAoGAPFrl\n3SpVj++2uB77F4WkJoMiZ4oEmktnUlDhokWOFN8Ss3nDsMELCraSf06RRfNqlK/D\nBEEWbrihcep366jruwv75BVE4qw0jCauMeDdTro79c5f8umQLa6FfQi6mRI+gj1N\nX1cPa+YJ740LVeZKKgnFole4ojFsm7Od9hXeyl0CgYAIbmWi/bCkJXx2Mb0jEZjj\nE0NqeWQw/nJwr51amBPyDr+LSd5U8ISBAr/9Jk617mgcJ/Nj/vkFK6PQ3Gdcg+zu\n3+jcRUHsdBp6KbhYzZ31ozUX73aChUCTu+IX2K/lAmKswSljlX9AqG9CCWzvddw9\nZ11f8cM3o3BiPEWxMN24VQ==\n-----END PRIVATE KEY-----\n";

const FOLDER_ID = '1P1rpHQ70Ri-tky27S1PTTWCfrpHQ70Ri';

async function shareFolder() {
    console.log("🚀 Iniciando Compartición de Carpeta...");

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: HARDCODED_EMAIL,
            private_key: HARDCODED_KEY,
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    try {
        console.log(`Intentando compartir carpeta ${FOLDER_ID}...`);

        await drive.permissions.create({
            fileId: FOLDER_ID,
            requestBody: {
                role: 'writer',
                type: 'user',
                emailAddress: 'jlcantujlct@gmail.com'
            }
        });

        console.log("✅ ¡ÉXITO! Carpeta compartida con jlcantujlct@gmail.com");
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

shareFolder();
