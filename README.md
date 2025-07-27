# Mpantsaka Proxy

Mpantsaka is a lightweight, secure CORS proxy that allows only specific **callers** and **target websites**.  
It is designed to work with **Traefik v1** and enforces security through **environment variables**.

---

## 🚀 Features
- Restricts which websites can call the proxy (`ALLOWED_ORIGINS`).
- Limits which target domains can be accessed (`ALLOWED_TARGETS`).
- Works with **Traefik v1** and auto-injects CORS headers.
- Fast and lightweight (built with Node.js & Express).
- Includes a simple frontend to display this README.

---

## 🌍 How to Test the Proxy

### ✅ 1. Check if the Proxy is Running
Run:
```bash
curl -I BASE_URL/
```
**Expected response:**
```
HTTP/1.1 403 Forbidden: Origin not allowed
```
(This means the proxy is rejecting unauthorized requests, which is correct.)

---

### ✅ 2. Test a Valid Proxy Request via POST
To check if `mpantsaka` correctly forwards requests to an **allowed target**, run:
```bash
curl -X POST "BASE_URL/proxy" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/some-resource"}'
```
**Expected response:**  
The target website's content, with proper CORS headers.

If you want to save the response to a file, use:
```bash
curl -X POST "BASE_URL/proxy" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/some-resource"}' \
  -o response.html
```

---

### ❌ 3. Test a Blocked Target
Try requesting a **blocked domain**:
```bash
curl -X POST "BASE_URL/proxy" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://blocked-site.com/"}'
```
**Expected response:**
```
HTTP/1.1 403 Forbidden: Target domain not allowed
```
This confirms that `ALLOWED_TARGETS` is working correctly.

---

## 📌 How to Call `mpantsaka` from a Frontend App

### ✅ Basic Fetch Example
```js
fetch("BASE_URL/proxy", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ url: "https://example.com/some-resource" })
})
  .then(response => response.text())
  .then(data => console.log("Proxy Response:", data))
  .catch(error => console.error("Proxy Error:", error));
```
This will work **only** if the request is made from an **allowed origin (`ALLOWED_ORIGINS`)**.

---

### ✅ Fetch with Headers
If the target API requires headers (e.g., `Authorization` or `Content-Type`):
```js
fetch("BASE_URL/proxy", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ACCESS_TOKEN"
  },
  body: JSON.stringify({ url: "https://example.com/api/data" })
})
  .then(response => response.json())
  .then(data => console.log("Data:", data))
  .catch(error => console.error("Error:", error));
```
This correctly passes headers to the target API.

---

## 🔧 Configuration via Environment Variables

### ✅ Set Allowed Callers (`ALLOWED_ORIGINS`)
Defines **which websites can call `mpantsaka`**.

```yaml
- ALLOWED_ORIGINS=https://yourfrontend.com
```
This ensures that **only your frontend** can use the proxy.

---

### ✅ Set Allowed Targets (`ALLOWED_TARGETS`)
Defines **which websites `mpantsaka` is allowed to fetch**.

```yaml
- ALLOWED_TARGETS=example.com,api.example.com,another-allowed-site.com
```
This ensures that **only specified domains** can be accessed.

---

## 🎯 Final Notes
- `mpantsaka` **only works if your request comes from an allowed origin (`ALLOWED_ORIGINS`)**.
- **Only whitelisted domains (`ALLOWED_TARGETS`) can be fetched** through the proxy.
- If you encounter **CORS errors**, ensure your frontend is hosted on an **allowed origin**.



