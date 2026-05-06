// Demo data for peer review system

export const demoReviewAssignments = [
  {
    _id: "demo-assignment-1",
    reviewerId: "user-123",
    projectSubmissionId: {
      _id: "demo-submission-1", 
      title: "E-commerce Shopping Cart - Built by Sarah Chen",
      description: "A fully functional shopping cart application with product catalog, user authentication, payment integration, and order management. Includes responsive design and modern UI components.",
      githubUrl: "https://github.com/sarahchen/ecommerce-cart",
      liveUrl: "https://ecommerce-cart-demo.vercel.app",
      presentationVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      images: [
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop"
      ]
    },
    projectTopicId: {
      _id: "topic-ecommerce",
      title: "E-commerce Shopping Cart System",
      description: "Build a complete shopping cart system with product catalog, user authentication, cart management, and checkout process. Should include responsive design and modern UI/UX practices.",
      evaluationRubric: [
        {
          criterion: "UI/UX Design and Responsiveness",
          description: "Evaluate the overall design quality, user experience, mobile responsiveness, and visual appeal of the application.",
          scoreRanges: {
            poor: { min: 0, max: 25 },
            fair: { min: 26, max: 50 },
            average: { min: 51, max: 65 },
            good: { min: 66, max: 85 },
            excellent: { min: 86, max: 100 }
          }
        },
        {
          criterion: "Shopping Cart Functionality", 
          description: "Assess the implementation of cart operations: add/remove items, quantity management, price calculations, and cart persistence.",
          scoreRanges: {
            poor: { min: 0, max: 25 },
            fair: { min: 26, max: 50 },
            average: { min: 51, max: 65 },
            good: { min: 66, max: 85 },
            excellent: { min: 86, max: 100 }
          }
        },
        {
          criterion: "Authentication & User Management",
          description: "Evaluate user registration, login, profile management, and session handling implementation.",
          scoreRanges: {
            poor: { min: 0, max: 25 },
            fair: { min: 26, max: 50 },
            average: { min: 51, max: 65 },
            good: { min: 66, max: 85 },
            excellent: { min: 86, max: 100 }
          }
        },
        {
          criterion: "Code Quality & Architecture",
          description: "Review code organization, component structure, state management, error handling, and overall architecture decisions.",
          scoreRanges: {
            poor: { min: 0, max: 25 },
            fair: { min: 26, max: 50 },
            average: { min: 51, max: 65 },
            good: { min: 66, max: 85 },
            excellent: { min: 86, max: 100 }
          }
        }
      ]
    },
    reviewId: {
      _id: "review-1",
      totalScore: 0,
      status: "pending"
    },
    status: "assigned",
    level: "intermediate",
    stack: "fullstack",
    assignedAt: "2025-11-06T14:30:00.000Z",
    createdAt: "2025-11-06T14:30:00.000Z",
    updatedAt: "2025-11-06T14:30:00.000Z"
  },
  {
    _id: "demo-assignment-2",
    reviewerId: "user-123",
    projectSubmissionId: {
      _id: "demo-submission-2",
      title: "Task Management Dashboard - Built by Alex Rodriguez", 
      description: "A modern task management application with drag-and-drop functionality, real-time updates, team collaboration features, and advanced filtering options.",
      githubUrl: "https://github.com/alexrodriguez/task-manager",
      liveUrl: "https://task-manager-pro.vercel.app",
      presentationVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      images: [
        "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop"
      ]
    },
    projectTopicId: {
      _id: "topic-taskmanager",
      title: "Task Management Dashboard",
      description: "Create a comprehensive task management system with kanban boards, team collaboration, notifications, and reporting features.",
      evaluationRubric: [
        {
          criterion: "Task Management Features",
          description: "Evaluate CRUD operations for tasks, status updates, priority management, and task organization capabilities.",
          scoreRanges: {
            poor: { min: 0, max: 25 },
            fair: { min: 26, max: 50 },
            average: { min: 51, max: 65 },
            good: { min: 66, max: 85 },
            excellent: { min: 86, max: 100 }
          }
        },
        {
          criterion: "User Interface & Drag-and-Drop",
          description: "Assess the implementation of kanban boards, drag-and-drop functionality, and overall user interface design.",
          scoreRanges: {
            poor: { min: 0, max: 25 },
            fair: { min: 26, max: 50 },
            average: { min: 51, max: 65 },
            good: { min: 66, max: 85 },
            excellent: { min: 86, max: 100 }
          }
        },
        {
          criterion: "Data Management & Persistence",
          description: "Review data storage, API integration, state management, and data persistence mechanisms.",
          scoreRanges: {
            poor: { min: 0, max: 25 },
            fair: { min: 26, max: 50 },
            average: { min: 51, max: 65 },
            good: { min: 66, max: 85 },
            excellent: { min: 86, max: 100 }
          }
        },
        {
          criterion: "Performance & Scalability",
          description: "Evaluate application performance, loading times, scalability considerations, and optimization techniques.",
          scoreRanges: {
            poor: { min: 0, max: 25 },
            fair: { min: 26, max: 50 },
            average: { min: 51, max: 65 },
            good: { min: 66, max: 85 },
            excellent: { min: 86, max: 100 }
          }
        }
      ]
    },
    reviewId: {
      _id: "review-2",
      totalScore: 0,
      status: "pending"
    },
    status: "assigned",
    level: "advanced", 
    stack: "frontend",
    assignedAt: "2025-11-05T09:15:00.000Z",
    createdAt: "2025-11-05T09:15:00.000Z",
    updatedAt: "2025-11-05T09:15:00.000Z"
  },
  {
    _id: "demo-assignment-3",
    reviewerId: "user-123",
    projectSubmissionId: {
      _id: "demo-submission-3",
      title: "Weather Forecast App - Built by Maria Garcia",
      description: "A simple weather application that fetches data from external APIs, displays current weather and forecasts, with location-based search functionality.",
      githubUrl: "https://github.com/mariagarcia/weather-app",
      liveUrl: "https://weather-forecast-simple.vercel.app",
      images: [
        "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop"
      ]
    },
    projectTopicId: {
      _id: "topic-weather",
      title: "Weather Forecast Application",
      description: "Build a weather application that integrates with weather APIs, displays current conditions and forecasts, and includes search functionality.",
      evaluationRubric: [
        {
          criterion: "API Integration",
          description: "Evaluate the implementation of external weather API calls, error handling, and data processing.",
          scoreRanges: {
            poor: { min: 0, max: 25 },
            fair: { min: 26, max: 50 },
            average: { min: 51, max: 65 },
            good: { min: 66, max: 85 },
            excellent: { min: 86, max: 100 }
          }
        },
        {
          criterion: "User Interface Design",
          description: "Assess the visual design, layout, user experience, and presentation of weather information.",
          scoreRanges: {
            poor: { min: 0, max: 25 },
            fair: { min: 26, max: 50 },
            average: { min: 51, max: 65 },
            good: { min: 66, max: 85 },
            excellent: { min: 86, max: 100 }
          }
        },
        {
          criterion: "Search & Location Features",
          description: "Review the implementation of location search, geolocation features, and location-based weather data.",
          scoreRanges: {
            poor: { min: 0, max: 25 },
            fair: { min: 26, max: 50 },
            average: { min: 51, max: 65 },
            good: { min: 66, max: 85 },
            excellent: { min: 86, max: 100 }
          }
        }
      ]
    },
    reviewId: {
      _id: "review-3", 
      totalScore: 0,
      status: "pending"
    },
    status: "assigned",
    level: "beginner",
    stack: "frontend", 
    assignedAt: "2025-11-07T16:45:00.000Z",
    createdAt: "2025-11-07T16:45:00.000Z",
    updatedAt: "2025-11-07T16:45:00.000Z"
  }
]

export const demoCompletedAssignments = [
  {
    _id: "demo-completed-1",
    reviewerId: "user-123",
    projectSubmissionId: {
      _id: "demo-completed-submission-1",
      title: "Blog Management System - Built by James Wilson",
      description: "A full-featured blog management system with CRUD operations, user authentication, comment system, and admin panel.",
      githubUrl: "https://github.com/jameswilson/blog-cms",
      liveUrl: "https://blog-management-demo.vercel.app",
      images: [
        "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop"
      ]
    },
    projectTopicId: {
      _id: "topic-blog",
      title: "Blog Management System",
      description: "Create a blog platform with content management, user authentication, and administrative features.",
      evaluationRubric: [
        {
          criterion: "Content Management",
          description: "Evaluate CRUD operations for blog posts, categories, and content organization.",
          scoreRanges: {
            poor: { min: 0, max: 25 },
            fair: { min: 26, max: 50 },
            average: { min: 51, max: 65 },
            good: { min: 66, max: 85 },
            excellent: { min: 86, max: 100 }
          }
        },
        {
          criterion: "User Authentication & Authorization",
          description: "Assess user management, role-based access, and security implementation.",
          scoreRanges: {
            poor: { min: 0, max: 25 },
            fair: { min: 26, max: 50 },
            average: { min: 51, max: 65 },
            good: { min: 66, max: 85 },
            excellent: { min: 86, max: 100 }
          }
        }
      ]
    },
    reviewId: {
      _id: "completed-review-1",
      totalScore: 88,
      status: "completed"
    },
    status: "completed",
    level: "intermediate",
    stack: "fullstack",
    assignedAt: "2025-11-01T10:00:00.000Z",
    createdAt: "2025-11-01T10:00:00.000Z",
    updatedAt: "2025-11-03T15:30:00.000Z"
  }
]

export const demoSubmissions = [
  {
    _id: "my-submission-1",
    projectTopicId: {
      _id: "topic-auth-system",
      title: "User Authentication System - Sign Up & Login", 
      description: "Build a basic user authentication system with sign up and login functionality. The project should include form validation, error handling, loading states, and responsive design.",
      level: "intermediate",
      stack: "frontend"
    },
    talentId: "current-user-123",
    title: "Authentication Workflow - Built by Current User",
    description: "A comprehensive authentication system with modern UI, form validation, and smooth user experience. Includes password strength checking and email verification flow.",
    githubUrl: "https://github.com/currentuser/auth-system",
    liveUrl: "https://auth-system-demo.vercel.app",
    presentationVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    images: [
      "https://images.unsplash.com/photo-1555421689-491a97ff2040?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop"
    ],
    reviewersAssigned: [
      {
        _id: "reviewer-1",
        email: "sarah.chen@example.com",
        firstName: "Sarah",
        lastName: "Chen"
      },
      {
        _id: "reviewer-2", 
        email: "alex.rodriguez@example.com",
        firstName: "Alex",
        lastName: "Rodriguez"
      }
    ],
    reviewsCompleted: 2,
    reviews: [
      {
        _id: "review-result-1",
        projectSubmissionId: "my-submission-1",
        reviewerId: "reviewer-1",
        projectTopicId: "topic-auth-system",
        totalScore: 85,
        overallFeedback: "Excellent implementation of the authentication system! The code is well-structured, the UI is intuitive, and the form validation is comprehensive. The loading states and error handling provide great user feedback. Minor improvements could be made in accessibility and some edge case handling.",
        strengths: [
          "Clean and modern UI design with excellent user experience",
          "Comprehensive form validation with clear error messages",
          "Well-implemented loading states and user feedback",
          "Good code organization and component structure",
          "Responsive design works well across all devices",
          "Proper error handling for API responses"
        ],
        improvements: [
          "Add ARIA labels for better accessibility support",
          "Implement password strength indicator",
          "Add unit tests for form validation logic",
          "Consider adding remember me functionality",
          "Improve error messages for network failures"
        ],
        status: "completed",
        level: "intermediate",
        stack: "frontend",
        rubricScores: [
          {
            criterion: "UI Implementation and Form Design",
            rating: "excellent",
            score: 92,
            comment: "Outstanding UI implementation with clean, modern design. Forms are intuitive and well-structured."
          },
          {
            criterion: "API Integration and Authentication Flow", 
            rating: "good",
            score: 80,
            comment: "Good integration with authentication APIs. Flow is smooth but could handle edge cases better."
          },
          {
            criterion: "Form Validation and Error Handling",
            rating: "excellent", 
            score: 88,
            comment: "Excellent validation logic with clear, helpful error messages and good user feedback."
          },
          {
            criterion: "Responsive Design and Code Quality",
            rating: "good",
            score: 78,
            comment: "Well-organized code and responsive design. Some areas could benefit from better abstraction."
          }
        ],
        createdAt: "2025-11-05T14:20:00.000Z",
        updatedAt: "2025-11-06T10:15:00.000Z",
        completedAt: "2025-11-06T10:15:00.000Z"
      },
      {
        _id: "review-result-2",
        projectSubmissionId: "my-submission-1", 
        reviewerId: "reviewer-2",
        projectTopicId: "topic-auth-system",
        totalScore: 72,
        overallFeedback: "Good solid implementation that meets the requirements. The authentication flow works correctly and the UI is functional. There are opportunities to improve the user experience, code optimization, and add more advanced features. Overall a competent implementation with room for enhancement.",
        strengths: [
          "Authentication flow works correctly end-to-end",
          "Basic form validation is implemented",
          "Responsive layout functions on different screen sizes",
          "Clean and readable code structure"
        ],
        improvements: [
          "Enhance visual design and user interface polish",
          "Add more sophisticated form validation",
          "Improve loading state animations and transitions",
          "Add input field focus states and better visual feedback",
          "Implement better error recovery mechanisms",
          "Add confirmation dialogs for important actions"
        ],
        status: "completed",
        level: "intermediate", 
        stack: "frontend",
        rubricScores: [
          {
            criterion: "UI Implementation and Form Design",
            rating: "good",
            score: 75,
            comment: "Functional UI that meets requirements but could be more polished and visually appealing."
          },
          {
            criterion: "API Integration and Authentication Flow",
            rating: "good", 
            score: 78,
            comment: "Authentication integration works well with proper request handling and response processing."
          },
          {
            criterion: "Form Validation and Error Handling",
            rating: "average",
            score: 68,
            comment: "Basic validation is present but could be more comprehensive and user-friendly."
          },
          {
            criterion: "Responsive Design and Code Quality",
            rating: "good",
            score: 70,
            comment: "Code is organized and responsive design works, but could benefit from optimization and refinement."
          }
        ],
        createdAt: "2025-11-05T14:20:00.000Z",
        updatedAt: "2025-11-06T16:45:00.000Z",
        completedAt: "2025-11-06T16:45:00.000Z"
      }
    ],
    finalScore: 78,
    status: "reviewed",
    submittedAt: "2025-11-05T12:00:00.000Z",
    level: "intermediate",
    stack: "frontend",
    individualScores: [
      {
        reviewer: "reviewer-1",
        score: 85,
        completedAt: "2025-11-06T10:15:00.000Z", 
        _id: "score-1"
      },
      {
        reviewer: "reviewer-2",
        score: 72,
        completedAt: "2025-11-06T16:45:00.000Z",
        _id: "score-2" 
      }
    ],
    createdAt: "2025-11-05T12:00:00.000Z",
    updatedAt: "2025-11-06T16:50:00.000Z",
    reviewedAt: "2025-11-06T16:45:00.000Z"
  },
  {
    _id: "my-submission-2", 
    projectTopicId: {
      _id: "topic-todo-app",
      title: "Todo List Application",
      description: "Create a todo list application with CRUD operations, filtering, and local storage persistence.",
      level: "beginner",
      stack: "frontend"
    },
    talentId: "current-user-123",
    title: "Modern Todo App - Built by Current User",
    description: "A sleek todo application with drag-and-drop functionality, category filtering, and beautiful animations.",
    githubUrl: "https://github.com/currentuser/todo-app", 
    liveUrl: "https://modern-todo-app.vercel.app",
    images: [
      "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop"
    ],
    reviewersAssigned: [
      {
        _id: "reviewer-3",
        email: "maria.garcia@example.com", 
        firstName: "Maria",
        lastName: "Garcia"
      }
    ],
    reviewsCompleted: 1,
    reviews: [],
    finalScore: 0,
    status: "assigned",
    submittedAt: "2025-11-07T08:30:00.000Z",
    level: "beginner", 
    stack: "frontend",
    individualScores: [],
    createdAt: "2025-11-07T08:30:00.000Z",
    updatedAt: "2025-11-07T09:00:00.000Z"
  }
]

// Configuration for demo mode
export const DEMO_MODE = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true'