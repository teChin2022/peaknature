'use client'

import Link from 'next/link'
import { ArrowLeft, Shield, Eye, Lock, UserCheck, Trash2, Cookie, Mail } from 'lucide-react'
import { Tenant } from '@/types/database'
import { useLanguage } from '@/components/providers/language-provider'

interface PrivacyPolicyClientProps {
  tenant: Tenant
}

export function PrivacyPolicyClient({ tenant }: PrivacyPolicyClientProps) {
  const { locale } = useLanguage()
  const lastUpdated = '2024-12-01'

  const content = locale === 'th' ? {
    title: 'นโยบายความเป็นส่วนตัว',
    lastUpdated: `อัปเดตล่าสุด: ${lastUpdated}`,
    backToHome: 'กลับหน้าแรก',
    intro: `${tenant.name} ("เรา", "ของเรา") ให้ความสำคัญกับความเป็นส่วนตัวของคุณ นโยบายนี้อธิบายวิธีที่เราเก็บรวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณเมื่อคุณใช้บริการจองห้องพักของเรา`,
    sections: [
      {
        icon: Eye,
        title: '1. ข้อมูลที่เราเก็บรวบรวม',
        content: `เราเก็บรวบรวมข้อมูลต่อไปนี้เมื่อคุณใช้บริการของเรา:

**ข้อมูลส่วนบุคคล:**
• ชื่อ-นามสกุล
• อีเมล
• เบอร์โทรศัพท์
• ที่อยู่ (จังหวัด, อำเภอ, ตำบล)

**ข้อมูลการจอง:**
• วันที่เช็คอิน/เช็คเอาท์
• จำนวนผู้เข้าพัก
• ห้องพักที่เลือก
• คำขอพิเศษ

**ข้อมูลการชำระเงิน:**
• สลิปการโอนเงิน
• หมายเลข PromptPay (สำหรับการคืนเงิน)
• ประวัติการชำระเงิน

**ข้อมูลทางเทคนิค:**
• ที่อยู่ IP
• ประเภทเบราว์เซอร์
• ข้อมูลอุปกรณ์`
      },
      {
        icon: UserCheck,
        title: '2. วัตถุประสงค์ในการใช้ข้อมูล',
        content: `เราใช้ข้อมูลของคุณเพื่อ:

• **ดำเนินการจอง:** ยืนยันการจอง ส่งอีเมลยืนยัน และติดต่อเกี่ยวกับการเข้าพัก
• **การชำระเงิน:** ตรวจสอบการชำระเงิน ดำเนินการคืนเงิน
• **การสื่อสาร:** ส่งข้อมูลสำคัญเกี่ยวกับการจอง อัปเดตบริการ
• **ปรับปรุงบริการ:** วิเคราะห์การใช้งานเพื่อพัฒนาประสบการณ์ผู้ใช้
• **ความปลอดภัย:** ป้องกันการฉ้อโกงและกิจกรรมที่ไม่ได้รับอนุญาต
• **ปฏิบัติตามกฎหมาย:** ปฏิบัติตามข้อกำหนดทางกฎหมายที่เกี่ยวข้อง`
      },
      {
        icon: Shield,
        title: '3. การแชร์ข้อมูล',
        content: `เราอาจแชร์ข้อมูลของคุณกับ:

• **เจ้าของที่พัก:** ข้อมูลที่จำเป็นสำหรับการเข้าพัก (ชื่อ เบอร์โทร วันเข้าพัก)
• **ผู้ให้บริการชำระเงิน:** สำหรับการประมวลผลการชำระเงิน
• **ผู้ให้บริการอีเมล:** สำหรับการส่งอีเมลยืนยันและแจ้งเตือน
• **หน่วยงานราชการ:** เมื่อกฎหมายกำหนด

เราจะไม่ขายหรือให้เช่าข้อมูลส่วนบุคคลของคุณแก่บุคคลที่สาม`
      },
      {
        icon: Lock,
        title: '4. การรักษาความปลอดภัยของข้อมูล',
        content: `เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อปกป้องข้อมูลของคุณ:

• การเข้ารหัส SSL/TLS สำหรับการส่งข้อมูล
• การจัดเก็บข้อมูลบนเซิร์ฟเวอร์ที่ปลอดภัย
• การควบคุมการเข้าถึงข้อมูลอย่างเข้มงวด
• การตรวจสอบความปลอดภัยเป็นประจำ

อย่างไรก็ตาม ไม่มีวิธีการส่งข้อมูลทางอินเทอร์เน็ตหรือการจัดเก็บข้อมูลอิเล็กทรอนิกส์ใดที่ปลอดภัย 100%`
      },
      {
        icon: Trash2,
        title: '5. สิทธิของคุณ',
        content: `ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) คุณมีสิทธิ:

• **เข้าถึง:** ขอสำเนาข้อมูลส่วนบุคคลของคุณ
• **แก้ไข:** ขอให้แก้ไขข้อมูลที่ไม่ถูกต้อง
• **ลบ:** ขอให้ลบข้อมูลของคุณ (ภายใต้เงื่อนไขที่กำหนด)
• **จำกัดการประมวลผล:** ขอให้จำกัดการใช้ข้อมูลของคุณ
• **คัดค้าน:** คัดค้านการประมวลผลข้อมูลบางประเภท
• **โอนย้ายข้อมูล:** ขอรับข้อมูลในรูปแบบที่อ่านได้ด้วยเครื่อง

หากต้องการใช้สิทธิเหล่านี้ กรุณาติดต่อเราหรือลบบัญชีของคุณในหน้าตั้งค่า`
      },
      {
        icon: Cookie,
        title: '6. คุกกี้และเทคโนโลยีติดตาม',
        content: `เราใช้คุกกี้และเทคโนโลยีที่คล้ายกันเพื่อ:

• **คุกกี้ที่จำเป็น:** สำหรับการทำงานของเว็บไซต์ (การเข้าสู่ระบบ ตะกร้าจอง)
• **คุกกี้ประสิทธิภาพ:** เพื่อเข้าใจวิธีที่ผู้ใช้โต้ตอบกับเว็บไซต์
• **คุกกี้ภาษา:** จดจำการตั้งค่าภาษาที่คุณเลือก

คุณสามารถจัดการการตั้งค่าคุกกี้ผ่านเบราว์เซอร์ของคุณ`
      },
      {
        icon: Mail,
        title: '7. การติดต่อเรา',
        content: `หากคุณมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ หรือต้องการใช้สิทธิของคุณ กรุณาติดต่อ:

**${tenant.name}**
อีเมล: privacy@${tenant.slug}.com

เราจะตอบกลับภายใน 30 วัน`
      }
    ]
  } : {
    title: 'Privacy Policy',
    lastUpdated: `Last updated: ${lastUpdated}`,
    backToHome: 'Back to Home',
    intro: `${tenant.name} ("we", "our", "us") values your privacy. This policy explains how we collect, use, and protect your personal information when you use our accommodation booking services.`,
    sections: [
      {
        icon: Eye,
        title: '1. Information We Collect',
        content: `We collect the following information when you use our services:

**Personal Information:**
• Full name
• Email address
• Phone number
• Location (Province, District, Sub-district)

**Booking Information:**
• Check-in/Check-out dates
• Number of guests
• Selected room
• Special requests

**Payment Information:**
• Payment slip/transfer receipt
• PromptPay number (for refunds)
• Payment history

**Technical Information:**
• IP address
• Browser type
• Device information`
      },
      {
        icon: UserCheck,
        title: '2. How We Use Your Information',
        content: `We use your information to:

• **Process Bookings:** Confirm reservations, send confirmation emails, and contact you about your stay
• **Payment Processing:** Verify payments and process refunds
• **Communication:** Send important information about your booking and service updates
• **Service Improvement:** Analyze usage to improve user experience
• **Security:** Prevent fraud and unauthorized activities
• **Legal Compliance:** Comply with applicable legal requirements`
      },
      {
        icon: Shield,
        title: '3. Information Sharing',
        content: `We may share your information with:

• **Property Owners:** Necessary information for your stay (name, phone, dates)
• **Payment Providers:** For payment processing
• **Email Service Providers:** For sending confirmations and notifications
• **Government Authorities:** When required by law

We will never sell or rent your personal information to third parties.`
      },
      {
        icon: Lock,
        title: '4. Data Security',
        content: `We implement appropriate security measures to protect your information:

• SSL/TLS encryption for data transmission
• Secure server data storage
• Strict access controls
• Regular security audits

However, no method of transmission over the Internet or electronic storage is 100% secure.`
      },
      {
        icon: Trash2,
        title: '5. Your Rights',
        content: `Under the Personal Data Protection Act B.E. 2562 (PDPA) of Thailand, you have the right to:

• **Access:** Request a copy of your personal data
• **Rectification:** Request correction of inaccurate information
• **Erasure:** Request deletion of your data (subject to conditions)
• **Restriction:** Request limitation of data processing
• **Object:** Object to certain types of data processing
• **Portability:** Request your data in a machine-readable format

To exercise these rights, please contact us or delete your account in the Settings page.`
      },
      {
        icon: Cookie,
        title: '6. Cookies and Tracking',
        content: `We use cookies and similar technologies for:

• **Essential Cookies:** For website functionality (login, booking cart)
• **Performance Cookies:** To understand how users interact with our website
• **Language Cookies:** To remember your language preference

You can manage cookie settings through your browser.`
      },
      {
        icon: Mail,
        title: '7. Contact Us',
        content: `If you have questions about this Privacy Policy or wish to exercise your rights, please contact:

**${tenant.name}**
Email: privacy@${tenant.slug}.com

We will respond within 30 days.`
      }
    ]
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
          <Link 
            href={`/${tenant.slug}`}
            className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {content.backToHome}
          </Link>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">
            {content.title}
          </h1>
          <p className="text-stone-500">{content.lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="bg-white rounded-2xl border border-stone-200 p-8 mb-8">
          <p className="text-stone-600 leading-relaxed">{content.intro}</p>
        </div>

        <div className="space-y-8">
          {content.sections.map((section, index) => (
            <div key={index} className="bg-white rounded-2xl border border-stone-200 p-8">
              <div className="flex items-start gap-4 mb-4">
                <div 
                  className="p-3 rounded-xl flex-shrink-0"
                  style={{ 
                    backgroundColor: `${tenant.primary_color}15`,
                    color: tenant.primary_color 
                  }}
                >
                  <section.icon className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold text-stone-900 pt-2">
                  {section.title}
                </h2>
              </div>
              <div className="prose prose-stone max-w-none pl-16">
                <div 
                  className="text-stone-600 leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{ 
                    __html: section.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/• /g, '<br/>• ')
                  }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

