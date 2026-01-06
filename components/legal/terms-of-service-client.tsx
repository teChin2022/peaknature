'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, CreditCard, Calendar, UserX, AlertTriangle, Scale, RefreshCw, Shield } from 'lucide-react'
import { Tenant } from '@/types/database'
import { useLanguage } from '@/components/providers/language-provider'

interface TermsOfServiceClientProps {
  tenant: Tenant
}

export function TermsOfServiceClient({ tenant }: TermsOfServiceClientProps) {
  const { locale } = useLanguage()
  const lastUpdated = '2024-12-01'

  const content = locale === 'th' ? {
    title: 'ข้อกำหนดและเงื่อนไขการใช้บริการ',
    lastUpdated: `อัปเดตล่าสุด: ${lastUpdated}`,
    backToHome: 'กลับหน้าแรก',
    intro: `ยินดีต้อนรับสู่ ${tenant.name} กรุณาอ่านข้อกำหนดและเงื่อนไขเหล่านี้อย่างละเอียดก่อนทำการจอง การใช้บริการของเราถือว่าคุณยอมรับข้อกำหนดเหล่านี้`,
    sections: [
      {
        icon: FileText,
        title: '1. ข้อกำหนดทั่วไป',
        content: `**1.1 การยอมรับข้อกำหนด**
การใช้เว็บไซต์และบริการของ ${tenant.name} คุณยอมรับที่จะปฏิบัติตามข้อกำหนดเหล่านี้ หากคุณไม่ยอมรับ กรุณาอย่าใช้บริการของเรา

**1.2 คุณสมบัติผู้ใช้บริการ**
• คุณต้องมีอายุ 18 ปีบริบูรณ์ขึ้นไป หรือมีผู้ปกครองยินยอม
• คุณต้องให้ข้อมูลที่ถูกต้องและเป็นจริง
• คุณต้องรับผิดชอบในการรักษาความลับของบัญชีและรหัสผ่าน

**1.3 การเปลี่ยนแปลงข้อกำหนด**
เราขอสงวนสิทธิ์ในการแก้ไขข้อกำหนดเหล่านี้ได้ตลอดเวลา การเปลี่ยนแปลงจะมีผลทันทีเมื่อเผยแพร่บนเว็บไซต์`
      },
      {
        icon: Calendar,
        title: '2. การจองห้องพัก',
        content: `**2.1 การทำการจอง**
• การจองจะสมบูรณ์เมื่อได้รับการยืนยันจากเราเท่านั้น
• ราคาที่แสดงเป็นราคาต่อคืน และอาจมีการเปลี่ยนแปลงตามฤดูกาลหรือโปรโมชั่น
• จำนวนผู้เข้าพักต้องไม่เกินที่กำหนดไว้สำหรับแต่ละห้อง

**2.2 ข้อกำหนดการเข้าพัก**
• เช็คอิน: ตามเวลาที่กำหนดของแต่ละห้อง
• เช็คเอาท์: ตามเวลาที่กำหนดของแต่ละห้อง
• การเช็คอินก่อนเวลาหรือเช็คเอาท์หลังเวลาอาจมีค่าใช้จ่ายเพิ่มเติม

**2.3 การเข้าพักขั้นต่ำ**
• บางห้องอาจมีข้อกำหนดการเข้าพักขั้นต่ำ (เช่น 2 คืน)
• ในช่วงเทศกาลหรือวันหยุดยาวอาจมีข้อกำหนดเพิ่มเติม`
      },
      {
        icon: CreditCard,
        title: '3. การชำระเงิน',
        content: `**3.1 วิธีการชำระเงิน**
• รับชำระผ่าน PromptPay/โอนเงินธนาคารเท่านั้น
• ต้องอัปโหลดสลิปการโอนเงินเพื่อยืนยันการชำระเงิน
• การจองจะได้รับการยืนยันหลังจากตรวจสอบการชำระเงินสำเร็จ

**3.2 ราคาและค่าใช้จ่าย**
• ราคาที่แสดงเป็นราคาสุดท้าย (ไม่รวมบริการเสริม)
• ค่าบริการรับ-ส่งสนามบิน (ถ้ามี) จะแสดงแยกต่างหาก
• ค่าใช้จ่ายเพิ่มเติมใดๆ จะแจ้งให้ทราบก่อนการจอง

**3.3 ใบเสร็จรับเงิน**
• เราจะส่งใบเสร็จรับเงินทางอีเมลหลังการชำระเงินสำเร็จ
• สามารถขอใบกำกับภาษีได้โดยแจ้งล่วงหน้า`
      },
      {
        icon: RefreshCw,
        title: '4. การยกเลิกและคืนเงิน',
        content: `**4.1 นโยบายการยกเลิกโดยผู้เข้าพัก**
• ยกเลิกก่อน 7 วัน: คืนเงินเต็มจำนวน
• ยกเลิกก่อน 3-7 วัน: คืนเงิน 50%
• ยกเลิกน้อยกว่า 3 วัน: ไม่คืนเงิน
• ไม่มาเข้าพัก (No Show): ไม่คืนเงิน

**4.2 การยกเลิกโดยเจ้าของที่พัก**
หากเราจำเป็นต้องยกเลิกการจองด้วยเหตุผลอันสมควร:
• เราจะคืนเงินเต็มจำนวน
• พยายามหาที่พักทดแทนที่เทียบเท่าหรือดีกว่า
• แจ้งให้ทราบโดยเร็วที่สุด

**4.3 วิธีการคืนเงิน**
• คืนเงินผ่าน PromptPay ไปยังหมายเลขที่ลงทะเบียนไว้
• ดำเนินการคืนเงินภายใน 7-14 วันทำการ
• ต้องมีหมายเลขโทรศัพท์ที่ผูกกับ PromptPay

**4.4 เหตุสุดวิสัย**
ในกรณีเหตุสุดวิสัย (ภัยธรรมชาติ, โรคระบาด, ฯลฯ) เราจะพิจารณาเป็นกรณีไป`
      },
      {
        icon: UserX,
        title: '5. ความรับผิดชอบของผู้เข้าพัก',
        content: `**5.1 กฎระเบียบของที่พัก**
ผู้เข้าพักต้องปฏิบัติตามกฎระเบียบของที่พัก:
• งดส่งเสียงดังหลัง 22:00 น.
• ห้ามสูบบุหรี่ในพื้นที่ที่กำหนด (หรือทั้งหมดตามนโยบายที่พัก)
• ดูแลรักษาความสะอาดและทรัพย์สินของที่พัก
• ปฏิบัติตามกฎเกี่ยวกับสัตว์เลี้ยง (ถ้ามี)

**5.2 ความเสียหาย**
• ผู้เข้าพักต้องรับผิดชอบค่าเสียหายที่เกิดจากการกระทำของตนหรือผู้ติดตาม
• ต้องแจ้งความเสียหายให้ทราบทันที
• ค่าเสียหายจะประเมินตามราคาจริง

**5.3 ข้อห้าม**
• ห้ามใช้ที่พักเพื่อกิจกรรมผิดกฎหมาย
• ห้ามนำผู้อื่นที่ไม่ได้ลงทะเบียนเข้าพัก
• ห้ามใช้เกินจำนวนผู้เข้าพักที่จอง`
      },
      {
        icon: Shield,
        title: '6. ความรับผิดชอบของเจ้าของที่พัก',
        content: `**6.1 มาตรฐานที่พัก**
เราสัญญาว่าจะจัดเตรียม:
• ห้องพักที่สะอาดและพร้อมใช้งาน
• สิ่งอำนวยความสะดวกตามที่ระบุไว้
• ข้อมูลที่ถูกต้องเกี่ยวกับห้องพัก

**6.2 การแก้ไขปัญหา**
• หากพบปัญหา กรุณาแจ้งทันทีเพื่อให้เราแก้ไข
• เราจะพยายามแก้ไขปัญหาอย่างรวดเร็ว
• กรณีที่ไม่สามารถแก้ไขได้ เราจะพิจารณาการชดเชยที่เหมาะสม

**6.3 ข้อจำกัดความรับผิด**
เราไม่รับผิดชอบต่อ:
• ทรัพย์สินส่วนตัวที่สูญหายหรือเสียหาย
• ความล่าช้าหรือปัญหาจากเหตุสุดวิสัย
• ความเสียหายที่เกิดจากความประมาทของผู้เข้าพัก`
      },
      {
        icon: AlertTriangle,
        title: '7. ข้อจำกัดความรับผิด',
        content: `**7.1 ขอบเขตความรับผิด**
ความรับผิดสูงสุดของเราจำกัดไว้ที่จำนวนเงินที่คุณชำระสำหรับการจองนั้น

**7.2 ข้อยกเว้น**
เราไม่รับผิดชอบต่อ:
• ความเสียหายทางอ้อมหรือความเสียหายต่อเนื่อง
• การสูญเสียรายได้หรือโอกาสทางธุรกิจ
• ข้อมูลหรือทรัพย์สินสูญหาย

**7.3 การรับประกัน**
บริการของเราจัดให้ "ตามสภาพ" โดยไม่มีการรับประกันใดๆ ไม่ว่าโดยชัดแจ้งหรือโดยปริยาย`
      },
      {
        icon: Scale,
        title: '8. การระงับข้อพิพาท',
        content: `**8.1 การเจรจา**
ในกรณีมีข้อพิพาท ทั้งสองฝ่ายตกลงที่จะพยายามแก้ไขผ่านการเจรจาโดยสันติก่อน

**8.2 กฎหมายที่ใช้บังคับ**
ข้อกำหนดเหล่านี้อยู่ภายใต้กฎหมายของประเทศไทย

**8.3 เขตอำนาจศาล**
ข้อพิพาทใดๆ จะอยู่ภายใต้เขตอำนาจศาลในประเทศไทย

**8.4 การติดต่อ**
หากมีคำถามหรือข้อร้องเรียน กรุณาติดต่อ:
อีเมล: support@${tenant.slug}.com`
      }
    ]
  } : {
    title: 'Terms of Service',
    lastUpdated: `Last updated: ${lastUpdated}`,
    backToHome: 'Back to Home',
    intro: `Welcome to ${tenant.name}. Please read these Terms of Service carefully before making a booking. By using our services, you agree to these terms.`,
    sections: [
      {
        icon: FileText,
        title: '1. General Terms',
        content: `**1.1 Acceptance of Terms**
By using the ${tenant.name} website and services, you agree to comply with these terms. If you do not agree, please do not use our services.

**1.2 User Eligibility**
• You must be at least 18 years old, or have parental consent
• You must provide accurate and truthful information
• You are responsible for maintaining the confidentiality of your account and password

**1.3 Changes to Terms**
We reserve the right to modify these terms at any time. Changes take effect immediately upon publication on the website.`
      },
      {
        icon: Calendar,
        title: '2. Booking Terms',
        content: `**2.1 Making a Booking**
• Bookings are only complete upon confirmation from us
• Prices shown are per night and may vary by season or promotion
• Number of guests must not exceed the room capacity

**2.2 Stay Requirements**
• Check-in: As specified for each room
• Check-out: As specified for each room
• Early check-in or late check-out may incur additional charges

**2.3 Minimum Stay**
• Some rooms may have minimum stay requirements (e.g., 2 nights)
• Additional requirements may apply during holidays or festivals`
      },
      {
        icon: CreditCard,
        title: '3. Payment Terms',
        content: `**3.1 Payment Methods**
• We accept PromptPay/Bank Transfer only
• You must upload a payment slip to verify payment
• Booking is confirmed after successful payment verification

**3.2 Prices and Charges**
• Prices shown are final (excluding optional services)
• Airport pickup/drop-off fees (if applicable) are shown separately
• Any additional charges will be communicated before booking

**3.3 Receipts**
• We will email a receipt after successful payment
• Tax invoices are available upon advance request`
      },
      {
        icon: RefreshCw,
        title: '4. Cancellation and Refunds',
        content: `**4.1 Guest Cancellation Policy**
• Cancel 7+ days before: Full refund
• Cancel 3-7 days before: 50% refund
• Cancel less than 3 days: No refund
• No Show: No refund

**4.2 Host Cancellation**
If we need to cancel your booking for valid reasons:
• We will provide a full refund
• We will try to find comparable or better accommodation
• We will notify you as soon as possible

**4.3 Refund Method**
• Refunds are processed via PromptPay to your registered number
• Refunds are processed within 7-14 business days
• A PromptPay-linked phone number is required

**4.4 Force Majeure**
In cases of force majeure (natural disasters, pandemics, etc.), we will consider each case individually.`
      },
      {
        icon: UserX,
        title: '5. Guest Responsibilities',
        content: `**5.1 House Rules**
Guests must comply with property rules:
• No loud noise after 10:00 PM
• No smoking in designated areas (or entirely per property policy)
• Maintain cleanliness and care for property items
• Follow pet policies (if applicable)

**5.2 Damages**
• Guests are responsible for damages caused by themselves or their party
• Report any damages immediately
• Damages will be assessed at actual cost

**5.3 Prohibited Activities**
• Using the property for illegal activities is prohibited
• Bringing unregistered guests is prohibited
• Exceeding the booked number of guests is prohibited`
      },
      {
        icon: Shield,
        title: '6. Host Responsibilities',
        content: `**6.1 Property Standards**
We promise to provide:
• Clean and ready-to-use accommodations
• Amenities as listed
• Accurate information about the room

**6.2 Problem Resolution**
• If you encounter issues, please report immediately for resolution
• We will try to resolve problems quickly
• If unresolvable, we will consider appropriate compensation

**6.3 Liability Limitations**
We are not responsible for:
• Lost or damaged personal belongings
• Delays or issues due to force majeure
• Damages caused by guest negligence`
      },
      {
        icon: AlertTriangle,
        title: '7. Limitation of Liability',
        content: `**7.1 Liability Cap**
Our maximum liability is limited to the amount you paid for that booking.

**7.2 Exclusions**
We are not liable for:
• Indirect or consequential damages
• Loss of income or business opportunities
• Data or property loss

**7.3 Warranty**
Our services are provided "as is" without any warranties, express or implied.`
      },
      {
        icon: Scale,
        title: '8. Dispute Resolution',
        content: `**8.1 Negotiation**
In case of disputes, both parties agree to first attempt peaceful resolution through negotiation.

**8.2 Governing Law**
These terms are governed by the laws of Thailand.

**8.3 Jurisdiction**
Any disputes will be under the jurisdiction of Thai courts.

**8.4 Contact**
For questions or complaints, please contact:
Email: support@${tenant.slug}.com`
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

        {/* Agreement Notice */}
        <div 
          className="mt-12 p-6 rounded-2xl text-center"
          style={{ backgroundColor: `${tenant.primary_color}10` }}
        >
          <p className="text-stone-700">
            {locale === 'th' 
              ? 'การใช้บริการของเราหรือทำการจองถือว่าคุณยอมรับข้อกำหนดและเงื่อนไขเหล่านี้'
              : 'By using our services or making a booking, you agree to these Terms of Service.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}

