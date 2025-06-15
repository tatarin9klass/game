import { useEffect, useState } from 'react';
import Image from "next/image";

// Простой Button-компонент
const Button = (props: any) => (
  <button
    {...props}
    className="bg-white text-black rounded-xl px-4 py-2 hover:bg-gray-200 transition-all"
  />
);

declare global {
  interface Window {
    Telegram: any;
  }
}

export default function MiniAppGame() {
  const [scenes, setScenes] = useState<any[]>([]);
  const [currentSceneId, setCurrentSceneId] = useState("1");
  const [flags, setFlags] = useState<{ [key: string]: number | boolean }>({
    eda_proud: 0,
    serkan_first_impression: 0,
    humor: 0,
    serkan_contact: false,
  });
  const [replyText, setReplyText] = useState<string | null>(null);
  const [nextSceneTimeout, setNextSceneTimeout] = useState<NodeJS.Timeout | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/chapter_1.json")
      .then((res) => res.json())
      .then((data) => setScenes(data.scenes));

    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      const userData = tg.initDataUnsafe?.user;
      if (userData) {
        setUser(userData);
        console.log("User from Telegram:", userData);
      }
    }

    const savedFlags = localStorage.getItem("game_flags");
    const savedScene = localStorage.getItem("game_scene");
    if (savedFlags) setFlags(JSON.parse(savedFlags));
    if (savedScene) setCurrentSceneId(savedScene);
  }, []);

  useEffect(() => {
    localStorage.setItem("game_flags", JSON.stringify(flags));
    localStorage.setItem("game_scene", currentSceneId);
  }, [flags, currentSceneId]);

  const scene = scenes.find((s) => s.id === currentSceneId);

  const handleChoice = (choice: any) => {
    const updatedFlags = { ...flags };
    for (const key in choice.effects) {
      if (typeof updatedFlags[key] === 'boolean') {
        updatedFlags[key] = choice.effects[key];
      } else {
        updatedFlags[key] = (updatedFlags[key] as number || 0) + choice.effects[key];
      }
    }
    setFlags(updatedFlags);
    setReplyText(choice.reply);

    if (nextSceneTimeout) clearTimeout(nextSceneTimeout);

    const timeout = setTimeout(() => {
      setCurrentSceneId(choice.next);
      setReplyText(null);
    }, 2500);

    setNextSceneTimeout(timeout);
  };

  if (!scene) return <div className="text-white p-4">Загрузка...</div>;

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">
      <Image
        src={scene.image}
        alt="scene"
        layout="fill"
        objectFit="cover"
        className="opacity-70"
      />

      <div className="absolute top-4 left-4 right-4 bg-white text-black p-4 rounded-xl shadow-xl text-lg">
        {replyText ? replyText : scene.text}
      </div>

      {!replyText && (
        <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
          {scene.choices.map((choice: any, idx: number) => (
            <Button key={idx} onClick={() => handleChoice(choice)}>
              {choice.text}
            </Button>
          ))}
        </div>
      )}

      <div className="absolute top-4 right-4 text-xs bg-black/60 text-white px-2 py-1 rounded">
        <p>🎭 Юмор: {flags.humor}</p>
        <p>💪 Уверенность: {flags.eda_proud}</p>
        <p>😊 Вежливость: {flags.serkan_first_impression}</p>
        <p>📞 Контакт Серкана: {flags.serkan_contact ? "да" : "нет"}</p>
        {user && <p>👤 {user.first_name}</p>}
      </div>
    </div>
  );
}
