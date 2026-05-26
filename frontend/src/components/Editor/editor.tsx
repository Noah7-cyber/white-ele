/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef } from "react";
import EditorJS from "@editorjs/editorjs";

/** ✅ Tools */
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Checklist from "@editorjs/checklist";
import Table from "@editorjs/table";
// import Marker from "@editorjs/marker";
import InlineCode from "@editorjs/inline-code";
// import Paragraph from "@editorjs/paragraph";
// import Embed from "@editorjs/embed";
// import LinkTool from "@editorjs/link";
// import Raw from "@editorjs/raw";

import { Box } from "@mui/material";

type EditorProps = {
  data?: any;
  onChange?: (api: any, newData: any) => void;
};

const EditorComponent: React.FC<EditorProps> = ({ data, onChange }) => {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const initialDataRef = useRef(data);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!holderRef.current) return;

    const editor = new EditorJS({
      /** ✅ Wrapper */
      holder: holderRef.current,

      autofocus: true,
      minHeight: 0,
    //   maxHeight: 5000,
    //   height: "auto",
      placeholder: "Type a text or paste a link...",

      /** ✅ FULL TOOLSET CONFIG */
      tools: {
        /** ✅ Paragraph (default block) */
        // paragraph: {
        //   class: Paragraph,
        //   inlineToolbar: true,
        // },

        header: {
          class: Header as any,
          inlineToolbar: true,
          config: {
            placeholder: "Heading...",
            levels: [2, 3, 4],
            defaultLevel: 2,
          },
        },

        list: {
          class: List,
          inlineToolbar: true,
          config: {
            defaultStyle: "unordered",
          },
        },
        checklist: {
          class: Checklist,
          inlineToolbar: true,
        },

        table: {
          class: Table as any,
          inlineToolbar: true,
          config: {
            rows: 2,
            cols: 2,
          },
        },
        inlineCode: InlineCode,
      },

      data: initialDataRef.current,

      /** ✅ Capture changes */
      async onChange(api) {
        const output = await api.saver.save();
        onChangeRef.current?.(api, output);
      },
    });

    editorRef.current = editor;

    return () => {
      if (editorRef.current?.destroy) {
        editorRef.current.destroy();
      }
      editorRef.current = null;
    };
  }, []);

  return (
    <>
      {/* ✅ Required global CSS override — keeps toolbar visible */}
      <style jsx global>{`
        .ce-toolbar__actions {
          opacity: 1 !important;
          visibility: visible !important;
          padding: 0px 4px !important;
        }
    
      `}</style>

      <Box
        ref={holderRef}
        className="!h-full max-h-[300px] w-full codex-editor__redactor flex flex-col items-start border-none bg-header-gray rounded-lg px-14 !text-sm !pt-0.5"
      />
    </>
  );
};

export default EditorComponent;
