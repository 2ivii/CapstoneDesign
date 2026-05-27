import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Sparkles,
  Camera,
  Upload,
  X,
  Plus,
  MessageSquare,
  Trash2,
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  hasImage?: boolean;
};

type ChatRoom = {
  id: string;
  title: string;
  subject: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
};

export function AIChatbot() {
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([
    {
      id: "1",
      title: "수학 - 극한 문제",
      subject: "math",
      lastMessage: "lim(x→0) (sin x)/x 의 값을 구하시오",
      timestamp: new Date(Date.now() - 3600000),
      messages: [
        {
          id: "1",
          role: "assistant",
          content:
            "안녕하세요! AI 문제풀이 튜터입니다. 📚\n\n궁금한 문제를 텍스트로 입력하거나 사진으로 찍어 올려주세요. 단계별로 자세히 설명해드리겠습니다.",
          timestamp: new Date(Date.now() - 3600000),
        },
      ],
    },
  ]);
  const [currentChatId, setCurrentChatId] = useState<string>("1");
  const [inputText, setInputText] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("math");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const subjects = [
    { id: "math", name: "수학", color: "#10b981" },
    { id: "korean", name: "국어", color: "#f59e0b" },
    { id: "english", name: "영어", color: "#3b82f6" },
    { id: "science1", name: "생명과학1", color: "#8b5cf6" },
    { id: "science2", name: "지구과학1", color: "#06b6d4" },
    { id: "history", name: "한국사", color: "#ec4899" },
  ];

  const currentChat = chatRooms.find((chat) => chat.id === currentChatId);
  const messages = currentChat?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createNewChat = () => {
    const newChat: ChatRoom = {
      id: Date.now().toString(),
      title: `새 대화 - ${subjects.find((s) => s.id === selectedSubject)?.name}`,
      subject: selectedSubject,
      lastMessage: "",
      timestamp: new Date(),
      messages: [
        {
          id: "1",
          role: "assistant",
          content:
            "안녕하세요! AI 문제풀이 튜터입니다. 📚\n\n궁금한 문제를 텍스트로 입력하거나 사진으로 찍어 올려주세요. 단계별로 자세히 설명해드리겠습니다.",
          timestamp: new Date(),
        },
      ],
    };
    setChatRooms((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const deleteChat = (chatId: string) => {
    setChatRooms((prev) => prev.filter((chat) => chat.id !== chatId));
    if (currentChatId === chatId && chatRooms.length > 1) {
      const remainingChats = chatRooms.filter((chat) => chat.id !== chatId);
      setCurrentChatId(remainingChats[0].id);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !uploadedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputText,
      timestamp: new Date(),
      hasImage: !!uploadedImage,
    };

    setChatRooms((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [...chat.messages, userMessage],
              lastMessage: inputText,
              timestamp: new Date(),
            }
          : chat
      )
    );

    setInputText("");
    setIsLoading(true);

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputText, selectedSubject);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };
      setChatRooms((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [...chat.messages, assistantMessage],
                title:
                  chat.messages.length === 1
                    ? inputText.substring(0, 30) + (inputText.length > 30 ? "..." : "")
                    : chat.title,
              }
            : chat
        )
      );
      setIsLoading(false);
      setUploadedImage(null);
    }, 1500);
  };

  const generateAIResponse = (question: string, subject: string): string => {
    // 실제로는 AI API 호출
    if (subject === "math") {
      return `**문제 분석**\n${question}\n\n**풀이 과정**\n\n**1단계: 개념 확인**\n이 문제는 극한의 기본 성질을 활용하는 문제입니다.\n\n**2단계: 공식 적용**\nlim(x→0) (sin x)/x = 1 (기본 극한 공식)\n\n**3단계: 계산**\n주어진 식에 공식을 적용하면 답은 **1**입니다.\n\n**핵심 개념**\n- 삼각함수의 극한\n- 로피탈 정리 (선택적)\n\n**유사 문제**\nlim(x→0) (tan x)/x 를 구해보세요!\n\n더 궁금한 점이 있으면 언제든 물어보세요! 😊`;
    } else if (subject === "korean") {
      return `**문제 분석**\n${question}\n\n**해설**\n\n**1. 작품의 배경**\n이 작품은 화자의 내면적 감정을 자연물에 투영하여 표현하고 있습니다.\n\n**2. 화자의 정서**\n- 주된 정서: 그리움, 고독\n- 표현 기법: 은유, 의인화\n\n**3. 시적 의미**\n화자는 자연을 통해 자신의 감정을 승화시키고 있습니다.\n\n**참고 자료**\n- 해당 작가의 다른 작품들\n- 시대적 배경\n\n추가로 궁금한 부분이 있으면 말씀해주세요!`;
    } else if (subject === "english") {
      return `**Question Analysis**\n${question}\n\n**Explanation**\n\n**What (관계대명사 what)**\n- 선행사를 포함: "~하는 것"\n- 예: What he said is true. (그가 말한 것은 사실이다)\n\n**Which (관계대명사 which)**\n- 선행사 필요: 사물을 지칭\n- 예: The book which I bought is interesting.\n\n**Key Differences**\n1. What은 선행사 포함, Which는 선행사 필요\n2. What은 명사절, Which는 형용사절\n\n**Practice**\nTry to use both in sentences!\n\n더 설명이 필요한 부분이 있나요?`;
    } else if (subject === "science1") {
      return `**문제 분석**\n${question}\n\n**개념 설명**\n\n**1. 핵심 개념**\n이 문제는 생명과학의 기본 원리를 이해하는 문제입니다.\n\n**2. 풀이 방법**\n- 단계별 접근\n- 관련 개념 연결\n\n**3. 정답 및 해설**\n자세한 풀이와 함께 설명드리겠습니다.\n\n궁금한 점이 있으면 물어보세요!`;
    } else if (subject === "science2") {
      return `**문제 분석**\n${question}\n\n**지구과학 개념**\n\n**1. 관련 이론**\n이 문제와 관련된 지구과학 이론을 설명드리겠습니다.\n\n**2. 풀이 과정**\n단계별로 접근하여 해결하겠습니다.\n\n**3. 핵심 포인트**\n- 중요 개념\n- 주의할 점\n\n추가 질문 있으시면 말씀해주세요!`;
    } else if (subject === "history") {
      return `**문제 분석**\n${question}\n\n**한국사 설명**\n\n**1. 역사적 배경**\n해당 시대의 역사적 배경과 맥락을 설명드리겠습니다.\n\n**2. 핵심 내용**\n- 주요 사건과 인물\n- 시대적 특징\n- 역사적 의의\n\n**3. 정답 해설**\n자세한 설명과 함께 답을 제시하겠습니다.\n\n더 궁금한 점이 있으면 물어보세요!`;
    }
    return `**질문 분석**\n${question}\n\n이 문제에 대해 자세히 설명해드리겠습니다. 단계별로 풀이해볼게요!\n\n추가 질문이 있으면 언제든 물어보세요! 😊`;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-hidden flex">
        {/* Chat List Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          {/* New Chat Button */}
          <div className="p-4 border-b">
            <Button
              onClick={createNewChat}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              새 대화
            </Button>
          </div>

          {/* Chat Rooms List */}
          <div className="flex-1 overflow-y-auto">
            {chatRooms.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setCurrentChatId(chat.id)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors group ${
                  currentChatId === chat.id ? "bg-emerald-50 border-l-4 border-l-emerald-600" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{chat.title}</h3>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{chat.lastMessage || "새 대화"}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {chat.timestamp.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header with Back Button */}
          <div className="bg-white border-b p-4">
            <button
              onClick={() => navigate("/ai-planner")}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              이전 단계 (AI 플래너)
            </button>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-emerald-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">AI 문제풀이 챗봇</h1>
                  <p className="text-sm text-gray-600">문제를 입력하면 AI가 단계별로 자세히 설명해드립니다</p>
                </div>
              </div>
              <Badge className="bg-emerald-600">AI 튜터 활성화</Badge>
            </div>

            {/* Subject Tabs */}
            <div className="mt-4">
              <Tabs value={selectedSubject} onValueChange={setSelectedSubject}>
                <TabsList className="grid w-full grid-cols-6">
                  {subjects.map((subject) => (
                    <TabsTrigger key={subject.id} value={subject.id}>
                      {subject.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <Card className="flex-1 flex flex-col m-4 mt-0">
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === "user"
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-semibold text-emerald-600">AI 튜터</span>
                        </div>
                      )}
                      {message.hasImage && (
                        <div className="mb-2 p-2 bg-white/10 rounded">
                          <ImageIcon className="w-8 h-8" />
                          <p className="text-xs mt-1">이미지 첨부됨</p>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      <div
                        className={`text-xs mt-2 ${
                          message.role === "user" ? "text-emerald-100" : "text-gray-500"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                        <span className="text-sm text-gray-600">AI가 답변을 작성 중입니다...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input Area */}
              <div className="border-t p-4">
                {uploadedImage && (
                  <div className="mb-3 relative inline-block">
                    <img src={uploadedImage} alt="업로드된 이미지" className="h-20 rounded border" />
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <div className="flex gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <div className="p-2 border-2 border-gray-300 rounded-lg hover:border-emerald-500 transition-colors">
                        <Camera className="w-5 h-5 text-gray-600" />
                      </div>
                    </label>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <div className="p-2 border-2 border-gray-300 rounded-lg hover:border-emerald-500 transition-colors">
                        <Upload className="w-5 h-5 text-gray-600" />
                      </div>
                    </label>
                  </div>
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="문제를 입력하세요... (Shift+Enter로 줄바꿈)"
                    className="flex-1 min-h-[60px] resize-none"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() && !uploadedImage}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
