let language = localStorage.getItem("lang") || "fa"

window.addEventListener("load", (event) => {
    initLang();
    setLang(language);
    document.getElementById("worker-name").value = localStorage.getItem("worker-name") || "sub"
    document.getElementById("account-id").value = localStorage.getItem("account-id") || ""
    document.getElementById("api-token").value = localStorage.getItem("api-token") || ""
    document.getElementById("save-settings").checked = localStorage.getItem("save-settings") || false
})

function deploy() {
    if (document.getElementById("save-settings").checked) {
        localStorage.setItem('worker-name', document.getElementById("worker-name").value);
        localStorage.setItem("account-id", document.getElementById("account-id").value);
        localStorage.setItem("api-token", document.getElementById("api-token").value);
        localStorage.setItem("save-settings", true);
    } else {
        localStorage.removeItem('worker-name');
        localStorage.removeItem("account-id");
        localStorage.removeItem("api-token");
        localStorage.removeItem("save-settings");
    }

    const accountId = document.getElementById("account-id").value
    const apiToken = document.getElementById("api-token").value

    console.log({
        headers: {
            Authorization: `Bearer ${apiToken}`
        }
    })
    axios.defaults.headers.common = {"Authorization": `Bearer ${apiToken}`, "Access-Control-Allow-Origin": "*"}
    axios.get(`https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces`,).then(response => {
        console.log(response.data);
    }).catch((error) => {
        console.log('error ' + error);
    });
    // axios.get(`https://www.google.com`, {headers: {"Access-Control-Allow-Origin": "*"}}).then(response => {
    //     console.log(response.data);
    // }).catch((error) => {
    //     console.log('error ' + error);
    // });
}

function initLang() {
    for (code in strings) {
        const el = document.createElement("button")
        el.classList = "btn btn-outline-primary btn-sm rounded-2"
        el.id = `btn-${code}`
        el.type = "button"
        el.innerText = code.toUpperCase()
        el.setAttribute("data-lang", code);
        el.addEventListener("click", (e) => {
            setLang(e.srcElement.getAttribute("data-lang"))
        })
        document.getElementById("lang-group").appendChild(el)

        const el2 = document.createElement("span")
        el2.innerHTML = "&nbsp;"
        document.getElementById("lang-group").appendChild(el2)
    }
}

function setLang(code) {
    if (strings[code] === undefined) {
        code = "en"
    }
    document.getElementById('body').style.direction = directions[code] || "ltr"
    document.getElementById('btn-' + language).classList.remove('btn-primary')
    document.getElementById('btn-' + language).classList.add('btn-outline-primary')
    document.getElementById('btn-' + code).classList.remove('btn-outline-primary')
    document.getElementById('btn-' + code).classList.add('btn-primary')
    
    for (key in strings[code]) {
        document.getElementById(key).innerText = strings[code][key]
    }

    language = code
    localStorage.setItem('lang', code);
}

const directions = {
    en: "ltr",
    fa: "rtl",
}

const strings = {
    en: {
        "page-title": "Create v2ray Worker",
        "worker-name-title": "Worker Name",
        "account-id-title": "Account ID",
        "api-token-title": "API Token",
        "deploy-title": "Deploy Worker",
        "save-settings-label": "Save setting on current device for future use"
    },
    fa: {
        "page-title": "ایجاد ورکر v2ray",
        "worker-name-title": "نام ورکر",
        "account-id-title": "شناسه اکانت",
        "api-token-title": "توکن API",
        "deploy-title": "استقرار ورکر",
        "save-settings-label": "ذخیره اطلاعات روی دستگاه فعلی برای استفاده‌های بعدی",
    },
}