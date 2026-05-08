"use client"

import { Star } from "lucide-react"

const testimonials = [
  {
    quote: "EQHO cut our music editing time in half. The AI suggestions are incredibly accurate for cheer timing.",
    author: "Sarah Mitchell",
    role: "Head Coach",
    organization: "Cheer Athletics Houston",
    avatar: "SM",
  },
  {
    quote: "Finally, a tool that understands gymnastics floor music. The template library alone is worth it.",
    author: "Michael Chen",
    role: "Choreographer",
    organization: "Elite Gymnastics Academy",
    avatar: "MC",
  },
  {
    quote: "We used to spend days on routine music. Now it takes hours. Our athletes love the results.",
    author: "Jessica Rodriguez",
    role: "Gym Owner",
    organization: "Premier Dance & Acro",
    avatar: "JR",
  },
]

export function TestimonialsSection() {
  return (
    <section className="relative py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-eqho-navy via-eqho-slate/20 to-eqho-navy" />
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-eqho-pink">Testimonials</p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Loved by Coaches
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            See why hundreds of coaches trust EQHO for their competition music.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="group relative rounded-2xl border border-white/5 bg-eqho-slate/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/10 hover:bg-eqho-slate/50"
            >
              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-eqho-pink text-eqho-pink" />
                ))}
              </div>
              
              {/* Quote */}
              <blockquote className="text-base text-white/90 leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              
              {/* Author */}
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-eqho-pink to-eqho-blue">
                  <span className="text-sm font-semibold text-white">{testimonial.avatar}</span>
                </div>
                <div>
                  <div className="font-medium text-white">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}, {testimonial.organization}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
