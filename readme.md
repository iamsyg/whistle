frontend/
├── app/                     # expo-router (routes = screens)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── otp.tsx
│   │   └── profile-setup.tsx
│   │
│   ├── (tabs)/               # bottom tabs
│   │   ├── chats/
│   │   │   ├── index.tsx     # chat list
│   │   │   └── [groupId].tsx # chat room
│   │   │
│   │   ├── classrooms/
│   │   │   ├── index.tsx
│   │   │   └── [classId].tsx
│   │   │
│   │   ├── expenses/
│   │   │   ├── index.tsx
│   │   │   └── [groupId].tsx
│   │   │
│   │   └── profile.tsx
│   │
│   ├── modal/
│   │   ├── create-group.tsx
│   │   ├── add-expense.tsx
│   │   └── invite-member.tsx
│   │
│   └── _layout.tsx
│
├── components/
│   ├── chat/
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   └── TypingIndicator.tsx
│   │
│   ├── classroom/
│   │   ├── AnnouncementCard.tsx
│   │   └── AssignmentCard.tsx
│   │
│   ├── expenses/
│   │   ├── ExpenseItem.tsx
│   │   └── BalanceSummary.tsx
│   │
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Avatar.tsx
│
├── lib/
│   ├── supabase.ts           # supabase client
│   ├── api.ts                # fastapi REST client
│   ├── realtime.ts           # supabase realtime helpers
│   └── storage.ts            # file upload helpers
│
├── store/                    # global state
│   ├── auth.store.ts
│   ├── group.store.ts
│   └── chat.store.ts
│
├── hooks/
│   ├── useAuth.ts
│   ├── useRealtimeChat.ts
│   └── useExpenses.ts
│
├── types/
│   ├── user.ts
│   ├── group.ts
│   ├── message.ts
│   └── expense.ts
│
├── constants/
│   ├── colors.ts
│   └── config.ts
│
├── assets/
│   ├── icons/
│   └── images/
│
├── app.json
├── package.json
└── tsconfig.json





backend/
├── app/
│   ├── main.py               # FastAPI entry point
│   ├── config.py             # env & settings
│   │
│   ├── core/
│   │   ├── security.py       # JWT verification (Supabase)
│   │   ├── permissions.py    # role checks
│   │   └── dependencies.py
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   └── routes.py
│   │   │
│   │   ├── users/
│   │   │   └── routes.py
│   │   │
│   │   ├── groups/
│   │   │   └── routes.py
│   │   │
│   │   ├── classrooms/
│   │   │   └── routes.py
│   │   │
│   │   ├── chat/
│   │   │   └── routes.py     # REST fallback (history)
│   │   │
│   │   ├── expenses/
│   │   │   └── routes.py
│   │   │
│   │   └── ai/
│   │       └── routes.py     # future AI features
│   │
│   ├── models/               # Pydantic models
│   │   ├── user.py
│   │   ├── group.py
│   │   ├── message.py
│   │   └── expense.py
│   │
│   ├── services/             # business logic
│   │   ├── group_service.py
│   │   ├── chat_service.py
│   │   └── expense_service.py
│   │
│   ├── integrations/
│   │   ├── supabase.py
│   │   └── storage.py
│   │
│   └── utils/
│       └── helpers.py
│
├── tests/
│   ├── test_auth.py
│   ├── test_groups.py
│   └── test_expenses.py
│
├── requirements.txt
├── Dockerfile
└── .env
