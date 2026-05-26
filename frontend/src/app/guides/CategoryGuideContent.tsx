"use client";

import { useMemo, useState } from "react";
import { guidesContentRegistry, getDefaultTopicContent } from "./guideContentData";

interface GuideTopic {
  icon: string;
  label: string;
  slug: string;
}

interface GuideCategory {
  id: string;
  icon: string;
  title: string;
  description: string;
  topics: GuideTopic[];
}

export default function CategoryGuideContent({ category }: { category: GuideCategory }) {
  const initialTab = category.topics[0]?.slug ?? "";
  const [activeTab, setActiveTab] = useState(initialTab);

  const activeTopic = useMemo(
    () => category.topics.find((topic) => topic.slug === activeTab) ?? category.topics[0],
    [activeTab, category.topics],
  );

  const activeContent = useMemo(() => {
    if (!activeTopic) return null;
    
    // Resolve category-specific content when available.
    const categoryContent = guidesContentRegistry[category.id];
    if (categoryContent && categoryContent[activeTopic.slug]) {
      return categoryContent[activeTopic.slug];
    }

    // Fall back to generic placeholder content.
    return getDefaultTopicContent(activeTopic.label);
  }, [activeTopic, category.id]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2 border-b border-[#E4E7EC] pb-3 overflow-x-auto hide-scrollbar">
        {category.topics.map((topic) => (
          <button
            key={topic.slug}
            onClick={() => setActiveTab(topic.slug)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeTopic?.slug === topic.slug
                ? "bg-[#00897B] text-white shadow-sm"
                : "bg-gray-100 text-[#475467] hover:bg-gray-200"
            }`}
          >
            <span>{topic.icon}</span>
            <span>{topic.label}</span>
          </button>
        ))}
      </div>

      <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
        {activeContent}
      </div>
    </div>
  );
}
