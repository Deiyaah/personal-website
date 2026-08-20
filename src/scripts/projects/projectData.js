export const projects = [
    {
        id: 'lab-inventory',
        title: 'Lab Inventory Management',
        description: 'Capstone: an AI-first inventory system using Codex for app code and Spec-Kit for specs, APIs and architecture, with structured human review.',
        icon: '🧪',
        tags: ['Python', 'Codex', 'Speckit'],
        liveUrl: '#',
        githubUrl: 'https://github.com/Deiyaah'
    },
    {
        id: 'poker-time',
        title: 'Poker Time',
        description: 'Full-stack multiplayer poker built on a Rust server with a React client over WebSockets and SQLite. Up to 10 concurrent players and multiple variants.',
        icon: '♠️',
        tags: ['Rust', 'React', 'WebSockets', 'SQLite'],
        liveUrl: '#',
        githubUrl: 'https://github.com/Deiyaah'
    },
    {
        id: 'eventify',
        title: 'Eventify',
        description: 'Android app where players scan QR codes to join events, with Google Maps locations. Agile from stories → UML → Figma → JUnit/Espresso.',
        icon: '📱',
        tags: ['Java', 'Firebase', 'GCP', 'Android'],
        liveUrl: '#',
        githubUrl: 'https://github.com/Deiyaah'
    },
    {
        id: 'kessler-fuzzy',
        title: 'Kessler Fuzzy Agent',
        description: 'Genetic algorithms and fuzzy control for aiming and collision avoidance in Kessler Game, tuning the AI hyperparameters.',
        icon: '🚀',
        tags: ['Python', 'scikit-fuzzy', 'EasyGA'],
        liveUrl: '#',
        githubUrl: 'https://github.com/Deiyaah'
    }
];


export function getAllProjects() {
    return projects;
}

