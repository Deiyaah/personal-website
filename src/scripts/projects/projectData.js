export const projects = [
    {
        id: 'lab-inventory',
        title: 'Lab Inventory Management',
        description: 'Capstone: AI-first inventory system — Codex for app code, Spec-Kit for specs/APIs/architecture, with structured human review.',
        icon: '🧪',
        tags: ['Python', 'Codex', 'Speckit'],
        liveUrl: '#',
        githubUrl: 'https://github.com/Deiyaah',
        hasDemo: false,
        demoUrl: null,
        demoType: null
    },
    {
        id: 'poker-time',
        title: 'Poker Time',
        description: 'Full-stack multiplayer poker — Rust server, React client, WebSockets, SQLite. Up to 10 concurrent players and multiple variants.',
        icon: '♠️',
        tags: ['Rust', 'React', 'WebSockets', 'SQLite'],
        liveUrl: '#',
        githubUrl: 'https://github.com/Deiyaah',
        hasDemo: false,
        demoUrl: null,
        demoType: null
    },
    {
        id: 'eventify',
        title: 'Eventify',
        description: 'Android app where players scan QR codes to join events, with Google Maps locations. Agile from stories → UML → Figma → JUnit/Espresso.',
        icon: '📱',
        tags: ['Java', 'Firebase', 'GCP', 'Android'],
        liveUrl: '#',
        githubUrl: 'https://github.com/Deiyaah',
        hasDemo: false,
        demoUrl: null,
        demoType: null
    },
    {
        id: 'kessler-fuzzy',
        title: 'Kessler Fuzzy Agent',
        description: 'Genetic algorithms + fuzzy control for aiming and collision avoidance in Kessler Game — optimizing AI hyperparameters.',
        icon: '🚀',
        tags: ['Python', 'scikit-fuzzy', 'EasyGA'],
        liveUrl: '#',
        githubUrl: 'https://github.com/Deiyaah',
        hasDemo: false,
        demoUrl: null,
        demoType: null
    }
];

export function getProjectById(id) {
    return projects.find((project) => project.id === id);
}

export function getAllProjects() {
    return projects;
}

export function getProjectsWithDemos() {
    return projects.filter((project) => project.hasDemo);
}
