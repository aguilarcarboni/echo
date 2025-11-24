// Static data for Echo MVP demo

export const users = [{ id: 1, email: "user@example.com", name: "John Doe", company: "Acme Corp" }]

export const taskTypes = [
  { id: 1, name: "Cámara", description: "Video responses" },
  { id: 2, name: "Discusión", description: "Open questions" },
  { id: 3, name: "Galería", description: "Image reactions" },
  { id: 4, name: "Collage", description: "Creative image assembly" },
  { id: 5, name: "Clasificación", description: "Ranking items" },
  { id: 6, name: "Rellenar Espacios", description: "Fill in blanks" },
]

export const studies = [
  {
    id: 1,
    userId: 1,
    name: "Hábitos de Consumo de Snacks",
    objective: "Entender preferencias de snacks saludables",
    researchType: "Investigación de hábitos de consumo",
    segment: "Edad 18-35, urbanos",
    numParticipants: 50,
    durationDays: 7,
    status: "active",
    tasks: [
      { id: 1, taskTypeId: 1, prompt: "Haz un video sobre tu snack ideal", order: 1 },
      { id: 2, taskTypeId: 2, prompt: "¿Qué significa comer saludable para ti?", order: 2 },
    ],
  },
  {
    id: 2,
    userId: 1,
    name: "Test de Concepto de Bebida",
    objective: "Evaluar nuevo concepto de bebida funcional",
    researchType: "Test de concepto",
    segment: "Edad 25-45, activos",
    numParticipants: 30,
    durationDays: 5,
    status: "draft",
    tasks: [],
  },
  {
    id: 3,
    userId: 1,
    name: "Experiencia de Usuario en Apps",
    objective: "Identificar puntos de fricción en aplicaciones móviles",
    researchType: "Investigación de uso y de actitudes",
    segment: "Usuarios frecuentes de apps, 20-40 años",
    numParticipants: 40,
    durationDays: 10,
    status: "completed",
    tasks: [
      { id: 3, taskTypeId: 3, prompt: "Muéstranos capturas de tus apps favoritas", order: 1 },
      { id: 4, taskTypeId: 2, prompt: "¿Qué te frustra más al usar apps?", order: 2 },
    ],
  },
]

export const participants = [
  {
    id: "uuid1",
    studyId: 1,
    contact: "participant1@email.com",
    demographics: { age: 28, gender: "male", location: "San José" },
    status: "completed",
  },
  {
    id: "uuid2",
    studyId: 1,
    contact: "participant2@email.com",
    demographics: { age: 32, gender: "female", location: "San José" },
    status: "started",
  },
  {
    id: "uuid3",
    studyId: 1,
    contact: "participant3@email.com",
    demographics: { age: 24, gender: "female", location: "Heredia" },
    status: "invited",
  },
  {
    id: "uuid4",
    studyId: 3,
    contact: "participant4@email.com",
    demographics: { age: 35, gender: "male", location: "Cartago" },
    status: "completed",
  },
]

export const responses = [
  {
    id: 1,
    participantId: "uuid1",
    studyTaskId: 1,
    responseData: { videoUrl: "https://fakevideo.com/1" },
    submittedAt: "2023-10-01",
  },
  {
    id: 2,
    participantId: "uuid1",
    studyTaskId: 2,
    responseData: { text: "Comer saludable significa balance y nutrición" },
    submittedAt: "2023-10-01",
  },
  {
    id: 3,
    participantId: "uuid2",
    studyTaskId: 1,
    responseData: { videoUrl: "https://fakevideo.com/2" },
    submittedAt: "2023-10-02",
  },
  {
    id: 4,
    participantId: "uuid4",
    studyTaskId: 3,
    responseData: { images: ["https://fakeimage.com/1", "https://fakeimage.com/2"] },
    submittedAt: "2023-09-25",
  },
]

export const followUps = [
  { id: 1, responseId: 2, question: "¿Puedes dar más detalles?", answer: "Sí, prefiero frutas y nueces", type: "auto" },
  {
    id: 2,
    responseId: 3,
    question: "¿Qué tipo de snacks prefieres?",
    answer: "Snacks orgánicos y sin azúcar",
    type: "manual",
  },
]

export const analyses = [
  {
    id: 1,
    studyId: 1,
    summary: "La mayoría prefiere snacks naturales",
    insights: {
      themes: ["saludable", "conveniente", "natural"],
      recommendations: ["Desarrollar snacks portátiles", "Enfatizar ingredientes naturales", "Packaging ecológico"],
    },
  },
  {
    id: 2,
    studyId: 3,
    summary: "Los usuarios valoran la simplicidad y velocidad",
    insights: {
      themes: ["usabilidad", "velocidad", "diseño minimalista"],
      recommendations: ["Simplificar navegación", "Reducir tiempo de carga", "Interfaz más limpia"],
    },
  },
]

export const researchTypeOptions = [
  "Investigación de uso y de actitudes",
  "Investigación de hábitos de consumo",
  "Test de concepto",
  "Etnografía digital",
  "Diarios de usuario",
]
