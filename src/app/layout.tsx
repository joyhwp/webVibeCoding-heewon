import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import AmbientBackground from "@/components/AmbientBackground";
import PasswordGate from "@/components/PasswordGate";
import TabNav from "@/components/TabNav";
import PageTransition from "@/components/PageTransition";
import ToastContainer from "@/components/ToastContainer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Apple 스타일(SF Pro Display에 가장 가까운 Google Fonts 대안)이 필요한
// 제목류에 한해 쓰는 폰트 — WelcomeHeader의 "Welcome, {name}" 등
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Personal dashboard",
};

// 테마 초기화 스크립트: 하이드레이션 전에 동기적으로 실행돼서 깜빡임 없이
// data-theme를 세팅한다. 오늘 날짜로 저장된 수동 토글 값이 있으면 그걸,
// 없으면 06:00–17:59는 라이트, 그 외 시간은 다크로 자동 결정한다.
const THEME_INIT_SCRIPT = `(function(){try{
var KEY="themeOverride:v1";
var raw=localStorage.getItem(KEY);
var now=new Date();
var pad=function(n){return String(n).padStart(2,"0");};
var todayKey=now.getFullYear()+"-"+pad(now.getMonth()+1)+"-"+pad(now.getDate());
var theme=null;
if(raw){
  var parsed=JSON.parse(raw);
  if(parsed&&parsed.date===todayKey&&(parsed.theme==="light"||parsed.theme==="dark")){
    theme=parsed.theme;
  }
}
if(!theme){
  var hour=now.getHours();
  theme=(hour>=6&&hour<18)?"light":"dark";
}
document.documentElement.setAttribute("data-theme",theme);
}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col overflow-x-hidden">
        <AmbientBackground />
        <PasswordGate>
          <TabNav />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16">
            <PageTransition>{children}</PageTransition>
          </main>
          <ToastContainer />
        </PasswordGate>
      </body>
    </html>
  );
}
