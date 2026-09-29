// All page facts live here. Sourced from ../web-port/app/content.ts (facts only, no layout or style)
// and Natthakrit_Resume_edu.pdf (education, experience, extra projects, skills, email).

export type Link = { label: string; href: string; note?: string; handle?: string };
export type Fact = { key: string; value: string; mono?: boolean };

export const person = {
  nameFirst: "Natthakrit",
  nameLast: "Benjapatanamongkol",
  nameZh: "陳其骏",
};

export const meta: Fact[] = [
  { key: "Student ID", value: "m1561028", mono: true },
  { key: "Degree", value: "B.Eng., KMITL, 2024" },
  { key: "Role", value: "Freelance AI engineer" },
  { key: "Location", value: "Bangkok, Thailand" },
];

// Education and experience share one shape so they render as one timeline.
export type Entry = {
  org: string;
  title: string;
  when: string;
  facts?: Fact[];
  points?: { lead?: string; text: string }[];
};

export const education: Entry[] = [
  {
    org: "King Mongkut’s Institute of Technology Ladkrabang",
    title: "B.Eng. in Smart Materials Technology and Robotics and AI Engineering · International Program",
    when: "2021 – 2024",
    facts: [
      { key: "Courses", value: "Deep Learning · Computer Vision · Big Data · Cybersecurity" },
      { key: "Capstone", value: "Parking reservation system" },
    ],
  },
  {
    org: "St. Paul’s School, Darjeeling, India",
    title: "Science–Mathematics",
    when: "2017 – 2020",
  },
];

export const experience: Entry[] = [
  {
    org: "King Mongkut’s Institute of Technology Ladkrabang",
    title: "Freelance AI engineer",
    when: "2025 – present",
    points: [
      {
        lead: "AI-powered HR chatbot, lead developer.",
        text: "Built and tuned a full-stack RAG pipeline with Python, AWS Bedrock and a reranker model, then containerised it with Next.js, Python and Docker.",
      },
      {
        lead: "KMITL central lab chatbot, project lead.",
        text: "Led a two-person team building a RAG pipeline with a reranker over CSV files and website data, in Python on AWS Bedrock, with a Streamlit UI that can answer with images.",
      },
    ],
  },
  {
    org: "G-able Company Ltd.",
    title: "AI engineer intern",
    when: "Jul – Oct 2024",
    points: [
      {
        lead: "ITSM chatbot.",
        text: "Built a multi-agent chatbot with LangChain for the IT service management department, with SQL query tools, API data retrieval and web search.",
      },
    ],
  },
  {
    org: "Fukuoka Institute of Technology, Japan",
    title: "Internship program",
    when: "Jun – Jul 2024",
    points: [
      { text: "Built a racing simulation in Unity for research and training." },
      { text: "Designed and programmed a line-tracking robot with embedded, real-time processing." },
    ],
  },
];

// Each name needs a matching mark in icons.ts.
export const skills = [
  "Python",
  "LangChain",
  "TensorFlow",
  "PyTorch",
  "OpenAI",
  "YOLO",
  "AWS Bedrock",
  "Docker",
  "Git",
  "Next.js",
  "HTML",
  "CSS",
];

export const research = {
  title: "Focus: telling phone use from a phone on the desk",
  status: "In development · private repository",
  question:
    "Can a webcam tell a phone you are using apart from a phone that is just lying on your desk?",
  method:
    "An alert fires only when five conditions hold for a set dwell time: session active, face present, phone detected, keyboard and mouse idle, and the phone moving.",
  conditions: ["Session active", "Face present", "Phone detected", "Keyboard and mouse idle"],
  openCondition: "Phone moving",
  facts: [
    {
      key: "Models",
      value: "MediaPipe EfficientDet-Lite0 (float32) · BlazeFace short-range · runs fully offline",
      mono: true,
    },
    {
      key: "Finding",
      value:
        "The int8 build of EfficientDet-Lite0 returned near-noise on webcam frames: no person detected even with a person filling the frame. The float32 build of the same model detects both the person and the phone, so only float32 is used.",
    },
    {
      key: "Open question",
      value:
        "Is in-hand micro-motion separable from the detector’s frame-to-frame box jitter? A labelling prototype records box movement for phone-on-desk and phone-in-hand samples to compare the two. If they overlap, the motion condition is dropped.",
    },
  ] as Fact[],
};

export type Project = {
  id: string;
  title: string;
  tag: string;
  task: string;
  facts: Fact[];
  links: Link[];
};

export const projects: Project[] = [
  {
    id: "neocare",
    title: "NeoCare staff assistant",
    tag: "LLM · RAG",
    task: "Answers questions from NeoCare staff and the service team.",
    facts: [
      { key: "Method", value: "LLM + retrieval-augmented generation (RAG)", mono: true },
      { key: "Intended use", value: "Internal support for NeoCare staff." },
      {
        key: "Limits",
        value: "Access is restricted to Thailand by Cloudflare; the demo will not load from other countries.",
      },
    ],
    links: [{ label: "Open chatbot", href: "https://chatbot.neocarebkk.com/chatbot", note: "Thailand only" }],
  },
  {
    id: "stash",
    title: "Stash",
    tag: "Web app",
    task: "Save links now, find them again when you need them.",
    facts: [
      { key: "Stack", value: "Next.js · Drizzle ORM · Postgres · better-auth", mono: true },
      { key: "Intended use", value: "A searchable personal stash instead of a feed or a pile of tabs." },
      { key: "Limits", value: "Requires a Google sign-in." },
    ],
    links: [
      { label: "Live app", href: "https://stash-khsh.vercel.app/" },
      { label: "Source", href: "https://github.com/Natthakrittxx/stash" },
    ],
  },
];

export const moreProjects = [
  {
    year: "2025",
    title: "Emotion classification",
    text: "Takes the text from a speech-to-text model and sorts it into three emotion categories with OpenAI GPT-4.",
    stack: "Speech-to-text · GPT-4",
  },
  {
    year: "2024",
    title: "Parking reservation system",
    text: "Capstone. A Raspberry Pi runs the lot: ultrasonic sensors check spots in real time and OCR on the camera feed verifies each car. A Next.js interface takes reservations and checks licence plates against the backend.",
    stack: "Raspberry Pi · ultrasonic · OCR · Next.js",
  },
  {
    year: "2023",
    title: "Driver drowsiness detection",
    text: "A Raspberry Pi and camera watch the driver and raise a real-time alert. A custom YOLO model trained on a labelled dataset detects visual signs of drowsiness with 97% accuracy.",
    stack: "Raspberry Pi · YOLO",
  },
];

// Facebook is left out until there is a real profile URL (no dead links).
// Order follows the footer line: GitHub, then "say hello" (email). The handle is shown so the
// address can be read or copied even where mailto: opens nothing.
export const contact: Link[] = [
  { label: "GitHub", href: "https://github.com/Natthakrittxx", handle: "Natthakrittxx" },
  { label: "Email", href: "mailto:pornatthakritbenja@gmail.com", handle: "pornatthakritbenja@gmail.com" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/natthakrit-benjapatanamongkol-bb1385379",
    handle: "Natthakrit Benjapatanamongkol",
  },
  { label: "Instagram", href: "https://www.instagram.com/natthakrittx", handle: "@natthakrittx" },
];
