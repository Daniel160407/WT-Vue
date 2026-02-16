<script setup lang="ts">
import { ref } from "vue";
import { Button } from "primevue";
import { useRouter } from "vue-router";

type Locale = "en" | "ru" | "ka";

const router = useRouter();
const currentLocale = ref<Locale>("en");

const content = {
  en: {
    title: "Documentation",
    subtitle: "Learn how to master your language progress with WordsTeacher",
    cta: "Go to Languages",
    sections: [
      {
        header: "🚀 Quick Start Guide",
        text: "To begin your journey, you first need to define which language you want to learn. Navigate to the Languages page, click 'Add New Language', and select your target. Once a language is added, the 'Add Word' and 'Exercises' features will become available for that specific profile.",
      },
      {
        header: "Getting Started",
        text: "WordsTeacher is designed to help you build vocabulary through repetition and AI-powered exercises. Start by adding words to your list and practicing them daily.",
      },
      {
        header: "Levels & Cycles",
        text: "Each language has 5 levels. As words are “dropped”, they move to the next level. After completing a level, you move on to the next. Completing the 5th level means closing the “cycle” (dropping all words to the next level). By the time you complete the 5th level, you should already know all the words well, so they will be deleted and you will have the opportunity to add new ones. (Don't worry, all the words will be saved in your vocabulary, even after being deleted.)",
      },
      {
        header: "AI Assistant",
        text: "Use the AI Chat to generate custom exercises or ask for grammar explanations. The AI is context-aware and helps you practice specific words from your list.",
      },
    ],
  },
  ru: {
    title: "Документация",
    subtitle: "Узнайте, как максимально эффективно использовать WordsTeacher",
    cta: "Перейти к языкам",
    sections: [
      {
        header: "🚀 Быстрый старт",
        text: "Чтобы начать обучение, вам сначала нужно выбрать язык. Перейдите в раздел 'Языки', нажмите 'Добавить новый язык' и выберите цель. После добавления языка функции 'Добавить слово' и 'Упражнения' станут доступны для этого профиля.",
      },
      {
        header: "Начало работы",
        text: "WordsTeacher разработан для пополнения словарного запаса с помощью повторений и упражнений на базе ИИ. Начните с добавления слов и практикуйтесь ежедневно.",
      },
      {
        header: "Уровни и Циклы",
        text: "Каждый язык имеет 5 уровней. По мере «перекидования» слов они переходят на следующий уровень. После завершения уровня вы переходите к следующему. Завершение 5-го уровня означает завершение «цикла» (переход всех слов на следующий уровень). К моменту завершения 5-го уровня вы уже должны хорошо знать все слова, поэтому они будут удалены, и у вас появится возможность добавить новые. (Не волнуйтесь, все слова будут сохранены в вашем словарном запасе, даже после удаления.)",
      },
      {
        header: "ИИ-Помощник",
        text: "Используйте чат с ИИ для создания упражнений или объяснения грамматики. ИИ понимает контекст и помогает практиковать слова из вашего списка.",
      },
    ],
  },
  ka: {
    title: "დოკუმენტაცია",
    subtitle:
      "ისწავლეთ როგორ მართოთ თქვენი ენის პროგრესი WordsTeacher-თან ერთად",
    cta: "ენების გვერდზე გადასვლა",
    sections: [
      {
        header: "🚀 სწრაფი დაწყების გზამკვლევი",
        text: "სწავლის დასაწყებად, პირველ რიგში უნდა განსაზღვროთ, რომელი ენის შესწავლა გსურთ. გადადით 'ენების' გვერდზე, დააჭირეთ 'ახალი ენის დამატებას' და აირჩიეთ სასურველი ენა. ენის დამატების შემდეგ, სიტყვების დამატებისა და სავარჯიშოების ფუნქციები გააქტიურდება.",
      },
      {
        header: "დაწყება",
        text: "WordsTeacher შექმნილია ლექსიკის გასამყარებლად გამეორებისა და ხელოვნური ინტელექტის სავარჯიშოების მეშვეობით. დაიწყეთ სიტყვების დამატებით და ყოველდღიური პრაქტიკით.",
      },
      {
        header: "დონეები და ციკლები",
        text: "თითოეულ ენას აქვს 5 დონე. სიტყვების 'დადროპვისას' ისინი გადადიან შემდეგ დონეზე. დონის დასრულების შემდეგ გადადიხართ შემდეგზე. მე-5 დონის დასრულება ნიშნავს 'ციკლის' დახურვას (ყველა სიტყვის შემდეგ დონეზე 'დადროპვას'). მე-5 დონის დახურვისას თქვენ ყველა სიტყვა უკვე კარგად უნდა იცოდეთ, ამიტომ ისინი წაიშლებიან და გექნებათ ახალი სიტყვების დამატების საშუალება. (არ ინერვიულოთ, ყველა სიტყვა შეინახება თქვენს ლექსიკონში, წაშლის შემდეგაც)",
      },
      {
        header: "AI ასისტენტი",
        text: "გამოიყენეთ AI ჩატი სავარჯიშოების შესაქმნელად ან გრამატიკის განმარტებისთვის. ასისტენტი გეხმარებათ თქვენი სიიდან კონკრეტული სიტყვების პრაქტიკაში.",
      },
    ],
  },
};

const setLocale = (locale: Locale) => {
  currentLocale.value = locale;
};

const navigateToLanguages = () => {
  router.push("/languages");
};
</script>

<template>
  <div class="min-h-screen bg-[#1e1e1e] text-white p-6 md:p-12">
    <div class="max-w-4xl mx-auto">
      <div class="flex flex-wrap justify-between items-center gap-4 mb-10">
        <Button
          :label="content[currentLocale].cta"
          icon="pi pi-arrow-right"
          iconPos="right"
          @click="navigateToLanguages"
          class="bg-blue-600! border-blue-600! hover:bg-blue-700! text-white!"
        />

        <div class="flex gap-2">
          <Button
            label="EN"
            @click="setLocale('en')"
            :class="
              currentLocale === 'en'
                ? 'bg-[#ffc107]! text-black!'
                : 'bg-[#333]! text-white!'
            "
            size="small"
          />
          <Button
            label="RU"
            @click="setLocale('ru')"
            :class="
              currentLocale === 'ru'
                ? 'bg-[#ffc107]! text-black!'
                : 'bg-[#333]! text-white!'
            "
            size="small"
          />
          <Button
            label="KA"
            @click="setLocale('ka')"
            :class="
              currentLocale === 'ka'
                ? 'bg-[#ffc107]! text-black!'
                : 'bg-[#333]! text-white!'
            "
            size="small"
          />
        </div>
      </div>

      <header class="text-center mb-16">
        <h1 class="text-4xl md:text-5xl font-extrabold text-[#ffc107] mb-4">
          {{ content[currentLocale].title }}
        </h1>
        <p class="text-gray-400 text-lg">
          {{ content[currentLocale].subtitle }}
        </p>
      </header>

      <main class="space-y-12">
        <section
          v-for="(section, index) in content[currentLocale].sections"
          :key="index"
          class="bg-[#262626] p-8 rounded-2xl border border-[#333] shadow-lg transition-all duration-300 hover:border-[#ffc107]/50"
          :class="index === 0 ? 'border-l-4 border-l-blue-500' : ''"
        >
          <h2
            class="text-2xl font-bold text-white mb-4 flex items-center gap-3"
          >
            <span class="text-[#ffc107] text-sm font-mono opacity-70"
              >STEP 0{{ index + 1 }}</span
            >
            {{ section.header }}
          </h2>
          <p class="text-gray-300 leading-relaxed text-base md:text-lg">
            {{ section.text }}
          </p>
        </section>
      </main>

      <!-- <footer
        class="mt-20 pt-8 border-t border-[#333] text-center text-gray-500 text-sm"
      >
        &copy; 2026 WordsTeacher AI. Grounded in language science.
      </footer> -->
    </div>
  </div>
</template>
