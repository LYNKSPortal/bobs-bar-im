import type { Metadata } from "next";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const metadata: Metadata = { title: "FAQ" };

const FAQS = [
  {
    q: "Do I need to create an account to book?",
    a: "No. You can book as a guest with just your name, email, and phone number. We'll email you a confirmation and a link to manage your booking.",
  },
  {
    q: "Can I choose a specific table or simulator?",
    a: "For some activities, yes — you'll see a table/simulator selector during booking. For others, we automatically assign the best available resource for your chosen time.",
  },
  {
    q: "What happens if I need to cancel or reschedule?",
    a: "Use the 'manage your booking' link in your confirmation email any time before our cancellation deadline. After that, please call us directly.",
  },
  {
    q: "Is payment required when booking online?",
    a: "It depends on the activity. Some can be booked with pay-at-venue, others may require a deposit or full payment online, which is always shown clearly before you confirm.",
  },
  {
    q: "What if the time I want isn't available?",
    a: "We only show genuinely available times — if a slot isn't listed, every table or simulator is already booked, blocked, or outside opening hours for that period.",
  },
  {
    q: "Can I book for a large group?",
    a: "Some activities support a party size during booking. For large private events, please contact us directly.",
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-center font-heading text-4xl font-bold">Frequently Asked Questions</h1>
      <Accordion className="mt-10">
        {FAQS.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left font-heading text-lg">{item.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
