// HTML from "index.html"
export const DAEMON_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MCSManager Daemon</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
          sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0;
        padding: 20px;
      }

      .container {
        background: white;
        border-radius: 8px;
        padding: 48px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        max-width: 540px;
        width: 100%;
        text-align: center;
        transition: all 0.6s;
      }

      .container:hover {
        transform: scale(1.01);
      }

      .logo {
        width: 64px;
        height: 64px;
        margin: 0 auto 24px;
        background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 28px;
        font-weight: bold;
      }

      .title {
        font-size: 24px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 16px;
        line-height: 1.4;
      }

      .description {
        font-size: 16px;
        color: #6b7280;
        line-height: 1.6;
        margin-bottom: 12px;
      }

      .link-section {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid #e5e7eb;
      }

      .link-title {
        font-size: 14px;
        color: #9ca3af;
        margin-bottom: 8px;
        font-weight: 500;
      }

      .link {
        color: #1890ff;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s;
      }

      .link:hover {
        color: #40a9ff;
        text-decoration: underline;
      }

      .language-switcher {
        margin-top: 32px;
        display: flex;
        justify-content: center;
        gap: 8px;
      }

      .lang-btn {
        padding: 6px 12px;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 6px;
        color: #6b7280;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }

      .lang-btn:hover {
        border-color: #1890ff;
        color: #1890ff;
      }

      .lang-btn.active {
        background: #1890ff;
        border-color: #1890ff;
        color: white;
      }

      @media (max-width: 640px) {
        .container {
          padding: 32px 24px;
          margin: 16px;
        }

        .title {
          font-size: 20px;
        }

        .description {
          font-size: 15px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div id="content">
        <h1 class="title" id="title"></h1>
        <p class="description" id="desc1"></p>
        <p class="description" id="desc2"></p>

        <div class="link-section">
          <div class="link-title" id="doc-title"></div>
          <a
            class="link"
            href="https://docs.mcsmanager.com/advanced/distributed.html#daemon-key"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://docs.mcsmanager.com/advanced/distributed.html
          </a>
        </div>
      </div>

      <div class="language-switcher">
        <button class="lang-btn" data-lang="en-US">English</button>
        <button class="lang-btn" data-lang="zh-CN">中文</button>
        <button class="lang-btn" data-lang="ru-RU">Русский</button>
        <button class="lang-btn" data-lang="fr-FR">Français</button>
      </div>
    </div>

    <script>
      const translations = {
        "zh-CN": {
          title: "MCSManager Daemon 程序运行中",
          desc1:
            "此端口上正在运行的是 MCSManager 的 Daemon 程序，你可以使用 MCSManager 的 Web 端来连接它！",
          desc2:
            "连接协议为 WebSocket，需要配合密钥使用，具体请参考 MCSManager 的文档。如果此端口存在反向代理，内网映射等中间层，则需要确保 Websocket 协议能够正常使用。",
          "doc-title": "文档地址："
        },
        "en-US": {
          title: "MCSManager Daemon is Running",
          desc1: "The MCSManager Daemon is running on this port. Connect using the MCSManager Web!",
          desc2:
            "Uses WebSocket protocol with key authentication. Check MCSManager docs for details. Ensure WebSocket works through any reverse proxies or network mappings.",
          "doc-title": "Documentation:"
        },
        "ru-RU": {
          title: "MCSManager Daemon работает",
          desc1:
            "На этом порту работает MCSManager Daemon. Подключитесь через веб-интерфейс MCSManager!",
          desc2:
            "Протокол подключения - WebSocket, требуется ключ. Подробности в документации MCSManager. Убедитесь, что WebSocket работает через прокси или сетевые отображения.",
          "doc-title": "Документация:"
        },
        "fr-FR": {
          title: "MCSManager Daemon fonctionne",
          desc1:
            "Le programme MCSManager Daemon fonctionne sur ce port. Connectez-vous via l'interface web MCSManager !",
          desc2:
            "Protocole de connexion WebSocket avec clé d'authentification. Consultez la documentation MCSManager pour plus de détails. Assurez-vous que WebSocket fonctionne à travers les proxies ou mappages réseau.",
          "doc-title": "Documentation :"
        }
      };

      function getBrowserLanguage() {
        const lang = navigator.language || navigator.userLanguage;
        if (lang.startsWith("zh")) return "zh-CN";
        if (lang.startsWith("en")) return "en-US";
        if (lang.startsWith("ru")) return "ru-RU";
        if (lang.startsWith("fr")) return "fr-FR";
        return "en-US";
      }

      function setLanguage(lang) {
        const content = translations[lang];
        if (!content) return;

        document.getElementById("title").textContent = content.title;
        document.getElementById("desc1").textContent = content.desc1;
        document.getElementById("desc2").textContent = content.desc2;
        document.getElementById("doc-title").textContent = content["doc-title"];

        document.querySelectorAll(".lang-btn").forEach((btn) => {
          btn.classList.remove("active");
          if (btn.getAttribute("data-lang") === lang) {
            btn.classList.add("active");
          }
        });

        localStorage.setItem("mcsmanager-lang", lang);
      }

      document.addEventListener("DOMContentLoaded", function () {
        let lang = localStorage.getItem("mcsmanager-lang") || getBrowserLanguage();
        setLanguage(lang);

        document.querySelectorAll(".lang-btn").forEach((btn) => {
          btn.addEventListener("click", function () {
            const selectedLang = this.getAttribute("data-lang");
            setLanguage(selectedLang);
          });
        });
      });
    </script>
  </body>
</html>
`;
