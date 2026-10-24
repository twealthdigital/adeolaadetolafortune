// Everything shown in the "View all my services" dashboard lives in this file.
//
// ADD A SAMPLE: copy one { ... } block into that service's `samples` list. Nothing else to edit.
//   title, category, desc -> required
//   image: '/assets/images/your-shot.webp'  -> optional screenshot (a tile with the initials shows when empty)
//   link:  'https://example.com'            -> optional live link (adds a "View project" button)
//
// ADD A SERVICE: copy a whole service block. `icon` must be one of:
//   web, ai, mobile, uiux, video, automation
// Keep `title` identical to the heading on its card in the Services carousel,
// so the carousel's arrow button opens the right service here.
export const SERVICES = [
  {
    id: 'web',
    title: 'Web Development',
    icon: 'web',
    blurb: 'Fast, responsive websites and web platforms that present a business clearly and bring in customers.',
    samples: [
      {
        title: 'ACCOOM',
        category: 'Platform',
        desc: 'A student-focused accommodation platform connecting property seekers with agents through listings, property details, saved listings and messaging.'
      },
      {
        title: 'YTReak Global Technology',
        category: 'Business Website',
        desc: 'The digital presence of a technology agency, showcasing its website development, AI integration and mobile app services.'
      },
      {
        title: 'MM Beauty & Care',
        category: 'E-commerce',
        desc: 'An online beauty and personal-care shop with product categories, product discovery and brand storytelling.'
      },
      {
        title: 'NullCipher Security',
        category: 'Business Website',
        desc: 'A professional online presence for a cybersecurity brand, presenting its security services, technical expertise and ways to engage.'
      },
      {
        title: 'Nexa Infra',
        category: 'Business Website',
        desc: 'A digital presence for an infrastructure-focused business, organizing its brand and services into a clear website experience.'
      },
      {
        title: 'JAAM Power Washing',
        category: 'Business Website',
        desc: 'A web presence for an exterior-cleaning business, presenting its services and making it easy for customers to get in touch.'
      },
      {
        title: 'Business Solutions Academy',
        category: 'Education',
        desc: 'A digital experience for a coaching business, presenting its educational programs, course offerings and clear paths for prospective clients.'
      },
      {
        title: 'Blegab',
        category: 'E-commerce',
        desc: 'An online shopping experience that presents products clearly and gives customers a straightforward path from browsing to purchase.'
      }
    ]
  },
  {
    id: 'ai',
    title: 'AI / Software Engineering',
    icon: 'ai',
    blurb: 'AI features and software engineering that make products smarter and workflows faster.',
    samples: []
  },
  {
    id: 'mobile',
    title: 'Mobile App Development',
    icon: 'mobile',
    blurb: 'Mobile apps that give customers a smooth experience right on their phones.',
    samples: []
  },
  {
    id: 'uiux',
    title: 'UI/UX',
    icon: 'uiux',
    blurb: 'Clean, easy-to-use interface designs and prototypes, planned before a single line of code is written.',
    samples: []
  },
  {
    id: 'video',
    title: 'Video Editing',
    icon: 'video',
    blurb: 'Edited videos that tell your story and keep people watching.',
    samples: []
  },
  {
    id: 'automation',
    title: 'Automation',
    icon: 'automation',
    blurb: 'Automated workflows that remove repetitive tasks so your team can focus on growth.',
    samples: []
  }
];