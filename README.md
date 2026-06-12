# BrandPuzzle - Gamified Marketing Platform

BrandPuzzle is an innovative gamified marketing platform where brands create engaging puzzle campaigns and users play these puzzles to earn real money. The platform bridges the gap between brand marketing and user entertainment through interactive puzzle experiences.

## 🎮 Features

### For Gamers

- **Diverse Puzzle Types**: Enjoy trivia, word puzzles, image puzzles, memory games, and quizzes
- **Earn Real Money**: Get paid for completing puzzles from brand campaigns
- **Achievement System**: Unlock 30+ badges across different categories and skill levels
- **Leaderboards**: Compete with players worldwide and earn weekly rewards
- **Progress Tracking**: Monitor your stats, earnings, and performance over time
- **Mobile Optimized**: Seamless experience across all devices with touch-friendly controls

### For Brands

- **Campaign Management**: Create and manage puzzle campaigns with budget control
- **Analytics Dashboard**: Track campaign performance and user engagement
- **Target Audience**: Reach specific demographics through puzzle campaigns
- **Brand Integration**: Seamlessly integrate brand messaging into puzzle experiences
- **ROI Tracking**: Monitor campaign effectiveness and user interaction metrics

## 🛠 Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide React icons, Radix UI primitives
- **State Management**: Jotai for global state, TanStack Query for server state
- **Data Fetching**: Axios with interceptors, React Query for caching
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Token-based authentication with automatic refresh
- **Styling**: Tailwind CSS with custom design system and Fredoka font

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd brand-puzzle
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in your environment variables:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

4. **Set up the database**

   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
   - Enable Row Level Security (RLS) policies
   - Update your environment variables with the Supabase credentials

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗 Project Structure

```
src/
├── app/                           # Next.js App Router
│   ├── (routes)/
│   │   ├── (private-pages)/      # Protected routes
│   │   │   ├── user/             # Gamer dashboard, badges, profile
│   │   │   └── brand/            # Brand dashboard, campaigns, analytics
│   │   └── (public-pages)/       # Public routes (login, register, about)
│   ├── _utils/                   # Utility functions
│   │   ├── endpoints.ts          # API endpoint definitions
│   │   ├── routes.ts             # Frontend route definitions
│   │   ├── constants.ts          # Application constants
│   │   └── helper.ts             # Helper functions
│   ├── layout.tsx                # Root layout with providers
│   └── page.tsx                  # Landing page
├── atom/
│   └── user.ts                   # Jotai user state with localStorage
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── auth/                     # Authentication components
│   ├── layout/                   # Layout components (header, footer)
│   └── providers/                # React providers
├── lib/
│   ├── api.ts                    # Axios instance with auth interceptors
│   ├── supabase.ts               # Supabase client
│   ├── query-client.ts           # TanStack Query configuration
│   └── utils.ts                  # Utility functions
└── types/
    └── index.ts                  # TypeScript type definitions
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container
- `npm run deploy:vercel` - Deploy to Vercel

## 🎯 Puzzle System

### Puzzle Types

1. **Trivia**: Question-answer format with multiple choice
2. **Word Puzzles**: Word-based challenges and games
3. **Image Puzzles**: Visual recognition and matching challenges
4. **Memory Games**: Pattern and sequence memory challenges
5. **Quiz**: General knowledge and branded content quizzes

### Difficulty Levels

- **Easy**: Entry-level puzzles with basic rewards
- **Medium**: Moderate challenges with increased payouts
- **Hard**: Complex puzzles with premium rewards

### Earning System

- Users earn money based on puzzle difficulty and brand campaign budgets
- Payments processed through secure payment gateways
- Earnings tracked in real-time with detailed transaction history

## 🏆 Achievement System

### Badge Categories (30+ Badges)

- **Milestone Badges**: Puzzle completion milestones (8 badges)
- **Earnings Badges**: Money earned achievements (6 badges)
- **Specialist Badges**: Puzzle type mastery (5 badges)
- **Performance Badges**: Speed and accuracy achievements (6 badges)
- **Competitive Badges**: Leaderboard rankings (5 badges)

### Badge Difficulties

- **Bronze**: Entry-level achievements
- **Silver**: Moderate accomplishments
- **Gold**: Significant milestones
- **Platinum**: Elite achievements

## 🏅 Leaderboard & Competition

### Weekly Competitions

- Global leaderboards with weekly resets
- Top 10 players receive exclusive badges
- Monetary rewards for top 3 finishers:
  - 1st Place: $500 bonus
  - 2nd Place: $300 bonus
  - 3rd Place: $200 bonus

### Ranking System

- Points based on puzzle completion and accuracy
- Difficulty multipliers for complex puzzles
- Streak bonuses for consecutive daily play

## 🔐 Authentication & Security

- **JWT Token Authentication**: Secure token-based system with refresh capability
- **Row Level Security**: Supabase RLS policies for data protection
- **User Type Access Control**: Separate permissions for gamers vs brands
- **Automatic Token Refresh**: Seamless session management
- **Data Privacy**: GDPR compliant data handling

## 👥 User Roles

### Gamers

- Create profiles and track progress
- Play puzzles to earn money
- Unlock achievements and badges
- Compete on global leaderboards
- Refer friends for bonus rewards

### Brands

- Create and manage puzzle campaigns
- Set budgets and target audiences
- Monitor campaign analytics
- Track user engagement metrics
- Manage payment distributions

## 🌟 Key Features

### Responsive Design

- Mobile-first approach with touch optimization
- Horizontal scrolling campaigns on mobile
- Loading skeletons for smooth user experience
- Adaptive layouts for all screen sizes

### Real-time Updates

- Live leaderboard updates
- Instant badge notifications
- Real-time earnings tracking
- Progress synchronization across devices

### Gamification Elements

- Achievement system with visual progress
- Streaks and daily challenges
- Social features and referral system
- Competitive leaderboards

## 🚀 Getting Started

### For Gamers

1. Register with email or social login
2. Complete your profile setup
3. Browse available puzzle campaigns
4. Start playing and earning money
5. Track progress and unlock badges

### For Brands

1. Register with company information
2. Create your first puzzle campaign
3. Set budget and target audience
4. Monitor campaign performance
5. Analyze user engagement data

## 🎨 Design System

### Typography

- **Primary Font**: Fredoka (playful, gamified feel)
- **Secondary Font**: Space Grotesk (clean, modern)

### Color Palette

- **Primary**: #6C5CE7 (Purple)
- **Secondary**: #00D9FF (Cyan)
- **Accent**: #FF6B9D (Pink)
- **Success**: #00E676 (Green)
- **Warning**: #FFEAA7 (Yellow)
- **Error**: #FF6B9D (Red)

### Components

- Glassmorphism effects with backdrop blur
- Gradient backgrounds and animated elements
- Consistent spacing and border radius
- Accessible color contrast ratios

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please contact [support@brandpuzzle.com](mailto:support@brandpuzzle.com) or create an issue in the repository.

## 🗺 Roadmap

- [ ] Real-time multiplayer puzzle competitions
- [ ] Advanced analytics dashboard for brands
- [ ] Mobile app development (iOS/Android)
- [ ] Integration with popular payment gateways
- [ ] AI-powered puzzle difficulty adjustment
- [ ] Social features and friend challenges
- [ ] Multi-language support
- [ ] NFT rewards for special achievements
- [ ] Brand partnership program
- [ ] Advanced targeting and segmentation

updated the remote origin

---

Built with ❤️ by the BrandPuzzle team
