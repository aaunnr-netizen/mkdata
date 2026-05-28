"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How fast is data delivery?",
    answer:
      "Data is delivered instantly to your line within seconds of purchase. Most users receive their data within 2-5 seconds. We guarantee delivery or your money back.",
  },
  {
    question: "What networks do you support?",
    answer:
      "We support all major Nigerian networks: MTN, Glo, Airtel, and 9Mobile. Each network has a wide range of plans from daily to monthly packages.",
  },
  {
    question: "Is my money safe on MK DATA?",
    answer:
      "Yes! All payments are secured by Flutterwave, one of Africa's leading payment processors. Your funds are protected with industry-standard encryption and security protocols.",
  },
  {
    question: "How do I create an account?",
    answer:
      "Creating an account is simple: Go to the app, enter your phone number, set a 6-digit PIN, and you're done. The entire process takes less than 60 seconds.",
  },
  {
    question: "Can I buy data without creating an account?",
    answer:
      "Yes! Guest purchases are available. Simply enter your phone number and recipient details without creating an account. However, creating an account gives you access to exclusive rewards.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="relative bg-[#f5faff] px-6 py-16 sm:px-8 sm:py-24 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-black uppercase text-[#008fef]">Support</p>
          <h2 className="mb-4 text-4xl font-black text-[#06133a] sm:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-[#526079]">
            Find answers to common questions about MK DATA.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full rounded-lg border border-[#d7e8ff] bg-white px-5 shadow-sm">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-b border-[#d7e8ff] py-4 last:border-b-0"
            >
              <AccordionTrigger className="text-left text-base font-black text-[#06133a] transition-colors hover:text-[#008fef]">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pt-4 text-base text-[#526079]">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 border-t border-[#d7e8ff] pt-12 text-center">
          <p className="mb-4 text-[#526079]">
            Can&apos;t find what you&apos;re looking for?
          </p>
          <a
            href="mailto:support@mkdata.com"
            className="inline-block font-black text-[#008fef] transition-colors hover:text-[#0060d0]"
          >
            Contact our support team
          </a>
        </div>
      </div>
    </section>
  );
}
