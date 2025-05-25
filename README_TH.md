<div align="center">
  <a href="https://mcsmanager.com/" target="_blank">
    <img src="https://public-link.oss-cn-shenzhen.aliyuncs.com/mcsm_picture/logo.png" alt="MCSManagerLogo.png" width="510px" />    
  </a>

  <br />
  
  <h1 id="mcsmanager">
    <a href="https://mcsmanager.com/" target="_blank">MCSManager Panel</a>
  </h1>

[![--](https://img.shields.io/badge/Support-Windows/Linux-green.svg)](https://github.com/MCSManager)
[![Status](https://img.shields.io/badge/npm-v8.9.14-blue.svg)](https://www.npmjs.com/)
[![Status](https://img.shields.io/badge/node-v16.20.2-blue.svg)](https://nodejs.org/en/download/)
[![Status](https://img.shields.io/badge/License-Apache%202.0-red.svg)](https://github.com/MCSManager)

[Official Website](http://mcsmanager.com/) | [Docs](https://docs.mcsmanager.com/) | [Discord](https://discord.gg/BNpYMVX7Cd)

 | [简体中文](README_ZH.md) | [繁體中文](README_TW.md) | [Deutsch](README_DE.md) | [Português BR](README_PTBR.md) |
[日本語](README_JP.md) | [Spanish](README_ES.md)

</div>

<br />

## อะไรคือ MCSManager?

**MCSManager Panel** (MCSM) คือ **แผงควบคุมที่ทันสมัย ​​ปลอดภัย** ถูกออกแบบมาเพื่อจัดการเซิรฟ์เวอร์ Minecraft และเซิร์ฟเวอร์สตรีมเกมส์ 

MCSManager ได้รับความนิยมในระดับหนึ่งในชุมชนแล้ว โดยเฉพาะอย่างยิ่งเนื่องมาจาก Minecraft MCSManager โดดเด่นในด้านการนำเสนอโซลูชันการจัดการแบบรวมศูนย์สำหรับอินสแตนซ์เซิร์ฟเวอร์หลายตัว และมอบระบบการอนุญาตผู้ใช้หลายคนที่ปลอดภัยและเชื่อถือได้ นอกจากนี้ เรายังมุ่งมั่นที่จะสนับสนุนผู้ดูแลระบบเซิร์ฟเวอร์ ไม่เพียงแต่สำหรับ Minecraft เท่านั้น แต่ยังรวมถึง Terraria และเกม Steam ต่างๆ ด้วย เป้าหมายของเราคือการส่งเสริมชุมชนที่เจริญรุ่งเรืองและให้การสนับสนุนสำหรับการจัดการเซิร์ฟเวอร์เกม

MCSManager **รองรับ อังกฤษ ฝรั่งเศส เยอรมัน อิตาลี ไทย ญี่ปุ่น โปรตุเกส จีนตัวย่อ และจีนตัวเต็ม** พร้อมแผนที่จะเพิ่มการรองรับภาษาอื่นๆ เพิ่มเติมในอนาคต!

**Terminal**

![failed_to_load_screenshot.png](/.github/panel-image.png)

**Instance List**

![failed_to_load_screenshot.png](/.github/panel-instances.png)

**Custom Layout**

![failed_to_load_screenshot.png](/.github/panel-custom-layout.gif)

## Features

1. การสร้างเซิร์ฟเวอร์ `Minecraft` Java/Bedrock เพียงคลิกเดียว
2. เข้ากันได้กับเซิร์ฟเวอร์เกมส์ `Steam` ส่วนใหญ่ ( เช่น `Palworld`, `Squad`, `Project Zomboid`, `Terraria`, และอื่นๆ)
3. UI ที่ปรับแต่งได้ สร้างเค้าโครงของคุณเอง
4. รองรับรูปภาพทั้งหมดบน 'Docker Hub' รองรับผู้ใช้หลายรายและรองรับบริการเชิงพาณิชย์!
5. จัดการเซิร์ฟเวอร์หลายเครื่องด้วยอินเทอร์เฟซเว็บเดียว
6. เทคโนโลยีสแต็กนั้นเรียบง่าย และคุณเพียงแค่ต้องมีความสามารถในการเขียน TypeScript ก็สามารถทำให้การพัฒนา MCSManager เสร็จสมบูรณ์ได้ทั้งหมด
7. และอีกมากมาย!

<br />

## Runtime Environment

MCSM รองรับ `Windows` และ `Linux`แต่ต้องการแค่ `Node.js` และไลบรารี่สำหรับการ **แตกไฟล์**

ต้องการ [Node.js 16.20.2](https://nodejs.org/en) หรือสูงกว่า

<br />

## Installation

### Windows

สำหรับ Windows, เราจัดเตรียมไฟล์ปฏิบัติการแบบแพ็คเกจ:

ไปที่ : [https://mcsmanager.com/](https://mcsmanager.com/)

<br />

### Linux

**ใช้เพียงแค่คำสั่งเดียว**

> สคริปต์จำเป็นต้องลงทะเบียนบริการระบบและต้องมีสิทธิ์ root ด้วยเหตุนี้

```bash
sudo su -c "wget -qO- https://script.mcsmanager.com/setup.sh | bash"
```

**Usage**

```bash
systemctl start mcsm-{web,daemon}
systemctl stop mcsm-{web,daemon}
```

- Only supports Ubuntu/Centos/Debian/Archlinux.
- Installation directory: `/opt/mcsmanager/`.

<br />

**ติดตั้งด้วยตนเองบน Linux**

- หากสคริปต์การติดตั้งไม่สามารถดำเนินการได้อย่างถูกต้อง คุณสามารถลองติดตั้งด้วยตนเอง

```bash
# สร้างไดเรกทอรี /opt ถ้ามันไม่มีอยู่
mkdir /opt
# สลับเป็น /opt
cd /opt/
# ดาวน์โหลด Node.js 20.11 หากคุณติดตั้ง Node.js 16+ ไว้แล้ว ให้ข้ามขั้นตอนนี้ไป
wget https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz
# แตกไฟล์ต้นฉบับของ Node.js
tar -xvf node-v20.11.0-linux-x64.tar.xz
# เพิ่ม Node.js ลงใน PATH ของระบบ
ln -s /opt/node-v20.11.0-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v20.11.0-linux-x64/bin/npm /usr/bin/npm

# เตรียมไดเรกทอรีการติดตั้ง MCSM
mkdir /opt/mcsmanager/
cd /opt/mcsmanager/

# ดาวน์โหลด MCSManager
wget https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz
tar -zxf mcsmanager_linux_release.tar.gz

# ติดตั้ง dependencies
./install.sh

# กรุณาเปิดเทอร์มินัลหรือหน้าจอสองจอ.

# เริ่ม daemon ก่อน.
./start-daemon.sh

# เริ่มต้นอินเทอร์เฟซเว็บที่เทอร์มินัลหรือหน้าจอที่สอง.
./start-web.sh

# สำหรับการเข้าถึงหน้าเว็ป ไปที่ http://localhost:23333/
# โดยทั่วไปอินเทอร์เฟซเว็บจะสแกนและเพิ่ม local Daemon โดยอัตโนมัติ.
```

วิธีการติดตั้งนี้จะไม่ตั้งค่า MCSManager เป็นบริการระบบโดยอัตโนมัติ ดังนั้น จึงจำเป็นต้องใช้ `screen` สำหรับการจัดการ สำหรับผู้ที่สนใจในการจัดการ MCSManager ผ่านบริการระบบ โปรดดูที่ wiki/documentation ของเรา

<br />

## Development

ส่วนนี้ได้รับการออกแบบมาโดยเฉพาะสำหรับนักพัฒนา ผู้ใช้ทั่วไปสามารถละเลยส่วนนี้ได้โดยไม่ต้องกังวล

### Plugins

เราใช้ "VS Code" เพื่อพัฒนา MCSManager คุณอาจต้องติดตั้งปลั๊กอินเหล่านี้:

- รองรับการแสดงผล i18n (I18n Ally)
- ตัวจัดรูปแบบโค้ด (Prettier)
- Vue - Offcial
- ESLint

### MacOS

```bash
git clone https://github.com/MCSManager/MCSManager.git
./install-dependents.sh
./npm-dev-macos.sh
```

### Windows

```bash
git clone https://github.com/MCSManager/MCSManager.git
./install-dependents.bat
./npm-dev-windows.bat
```

### Dependency Files

คุณต้องการไปที่ [PTY](https://github.com/MCSManager/PTY) และ [Zip-Tools](https://github.com/MCSManager/Zip-Tools) โครงการที่จะดาวน์โหลดไฟล์ไบนารีที่สอดคล้องกันและวางไว้ในไดเร็กทอรี `daemon/lib` เพื่อให้แน่ใจว่า `Emulation Terminal` และ `File Decompression` ทำงานอย่างเหมาะสม

### Build Production Version

```bash
./build.bat # Windows
./build.sh  # MacOS
```

Output Directory: "production-code"

<br />

## Code Contributing

หากคุณพบปัญหาใดๆ ขณะใช้ MCSManager คุณสามารถ [ส่งปัญหา](https://github.com/MCSManager/MCSManager/issues/new/choose) ได้หรือคุณสามารถแยกโปรเจ็กต์และมีส่วนร่วมโดยตรงได้โดยส่ง Pull Request

โปรดตรวจสอบให้แน่ใจว่าโค้ดที่ส่งมาทั้งหมดเป็นไปตามรูปแบบการเขียนโค้ดที่มีอยู่ของเรา สำหรับรายละเอียดเพิ่มเติม โปรดดูแนวทางที่ระบุไว้ใน [ฉบับนี้](https://github.com/MCSManager/MCSManager/issues/544)

<br />

## Browser Compatibility

- รองรับบนเบราว์เซอร์สมัยใหม่รวมถึง `Chrome` `Firefox` และ `Safari`
- การสนับสนุน `IE` ถูกยกเลิกแล้ว

<br />

## BUG Reporting

**ปัญหาที่ยังไม่ได้รับการแก้ไข:** [คลิกที่นี่](https://github.com/MCSManager/MCSManager/issues/new/choose)

**รายงานช่องโหว่ด้านความปลอดภัย:** [SECURITY.md](SECURITY.md)

<br />

## Internationalization

ขอขอบคุณผู้สนับสนุนเหล่านี้ที่จัดทำการแปลจำนวนมาก:

- [KevinLu2000](https://github.com/KevinLu2000)
- [Unitwk](https://github.com/unitwk)
- [JianyueLab](https://github.com/JianyueLab)
- [IceBrick](https://github.com/IceBrick01)

<br />

## License

ซอร์สโค้ดของ MCSManager ได้รับอนุญาตภายใต้ใบอนุญาต [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)

ลิขสิทธิ์ ©2025 MCSManager
