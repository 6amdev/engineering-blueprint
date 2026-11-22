// คู่มือผู้ใช้ (web doc) · แก้ชื่อระบบ / เมนูต่อโปรเจกต์ · ห้ามใส่ข้อมูลจริงหรือภาพที่มี PII
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'คู่มือการใช้งาน', // กรอกต่อโปรเจกต์: ชื่อระบบ
  description: 'คู่มือผู้ใช้ระบบ',
  cleanUrls: true,
  lastUpdated: true,
  locales: {
    root: {
      label: 'ไทย',
      lang: 'th',
      themeConfig: {
        nav: [{ text: 'คู่มือ', link: '/guide/' }],
        sidebar: { '/guide/': [{ text: 'เริ่มต้น', items: [{ text: 'ภาพรวม', link: '/guide/' }, { text: 'เข้าสู่ระบบ', link: '/guide/sign-in' }] }] },
        outline: { label: 'ในหน้านี้' },
        docFooter: { prev: 'ก่อนหน้า', next: 'ถัดไป' },
        lastUpdated: { text: 'อัปเดตล่าสุด' }
      }
    },
    en: {
      label: 'English',
      lang: 'en',
      title: 'User Guide',
      themeConfig: {
        nav: [{ text: 'Guide', link: '/en/guide/' }],
        sidebar: { '/en/guide/': [{ text: 'Getting started', items: [{ text: 'Overview', link: '/en/guide/' }] }] }
      }
    }
  },
  themeConfig: { search: { provider: 'local' } }
})
