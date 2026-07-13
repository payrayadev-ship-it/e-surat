import React, { useState, useRef, useEffect } from "react";
import { 
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare,
  Undo, Redo, Copy, Scissors, Clipboard, 
  Search, Table, Image, Sparkles, QrCode, Barcode, 
  Link2, Eye, Printer, FileDown, Heading, 
  HelpCircle, X, HelpCircle as LogoIcon, CheckCircle2,
  Minimize2, RefreshCw, FileText
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onAiDraftClick?: () => void;
}

export default function RichTextEditor({ value, onChange, placeholder, onAiDraftClick }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  
  // Dialog States
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("Gambar");

  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [sigName, setSigName] = useState("Ir. Joko Sutrisno, M.T.");
  const [sigTitle, setSigTitle] = useState("Direktur Utama");

  const [showQrModal, setShowQrModal] = useState(false);
  const [qrText, setQrText] = useState("FORSDIG-DOC-VALID");

  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeText, setBarcodeText] = useState("FGI-2026-001");

  const [showHyperlinkModal, setShowHyperlinkModal] = useState(false);
  const [hyperlinkUrl, setHyperlinkUrl] = useState("https://");
  const [hyperlinkText, setHyperlinkText] = useState("Tautan Resmi");

  // Find & Replace States
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");

  // Style Selection Dropdown States
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontSize, setFontSize] = useState("14px");
  const [lineHeight, setLineHeight] = useState("1.5");
  const [textBlock, setTextBlock] = useState("p");
  const [textColor, setTextColor] = useState("#1e293b");
  const [bgColor, setBgColor] = useState("transparent");

  // Page level decorations
  const [watermark, setWatermark] = useState("");
  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [usePageNumbers, setUsePageNumbers] = useState(false);

  // Preview Mode
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Counter States
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Sync initial content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || `<p>${placeholder || "Tulis draf surat resmi di sini..."}</p>`;
      updateCounts();
    }
  }, [value]);

  // Handle document selection saving
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSavedRange(selection.getRangeAt(0).cloneRange());
    }
  };

  const restoreSelection = () => {
    if (savedRange) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRange);
      }
    }
  };

  const handleEditorInput = () => {
    triggerEditorChange();
  };

  const triggerEditorChange = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      updateCounts();
    }
  };

  const updateCounts = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const text = (editorRef.current.textContent || editorRef.current.innerText || "").trim();
    setWordCount(text ? text.split(/\s+/).length : 0);
    setCharCount(text.length);
  };

  // Helper to execute simple commands
  const executeCommand = (command: string, value: string = "") => {
    restoreSelection();
    document.execCommand(command, false, value);
    triggerEditorChange();
  };

  // Advanced Selection Styling Helper
  const applyStyleToSelection = (styleName: string, styleValue: string) => {
    restoreSelection();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      if (range.collapsed) {
        // Empty selection - Insert span with zero-width space
        const span = document.createElement("span");
        span.style.cssText = `${styleName}: ${styleValue};`;
        span.appendChild(document.createTextNode("\u200B")); // Zero-width space
        range.insertNode(span);
        range.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Active selection - wrap content
        const span = document.createElement("span");
        span.style.cssText = `${styleName}: ${styleValue};`;
        try {
          span.appendChild(range.extractContents());
          range.insertNode(span);
        } catch (e) {
          // Cross element block safe fallback
          document.execCommand("styleWithCSS", false, "true");
          if (styleName === "font-size") {
            document.execCommand("fontSize", false, "3");
          }
        }
      }
      triggerEditorChange();
    }
  };

  // Insert HTML helper
  const insertHTMLAtCursor = (html: string) => {
    restoreSelection();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      const el = document.createElement("div");
      el.innerHTML = html;
      
      const frag = document.createDocumentFragment();
      let node;
      let lastNode;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);
      if (lastNode) {
        range.setStartAfter(lastNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      triggerEditorChange();
    } else if (editorRef.current) {
      editorRef.current.innerHTML += html;
      triggerEditorChange();
    }
  };

  // Insert Table Action
  const handleInsertTable = () => {
    let tableHtml = `<table class="border-collapse w-full border border-slate-350 my-4 text-xs font-sans"><tbody>`;
    for (let r = 0; r < tableRows; r++) {
      tableHtml += "<tr>";
      for (let c = 0; c < tableCols; c++) {
        tableHtml += `<td class="border border-slate-300 p-2.5 min-w-[60px] text-slate-800">Kolom ${c+1}</td>`;
      }
      tableHtml += "</tr>";
    }
    tableHtml += "</tbody></table><p>&nbsp;</p>";
    insertHTMLAtCursor(tableHtml);
    setShowTableModal(false);
  };

  // Insert Image Action
  const handleInsertImage = () => {
    const imgHtml = `<img src="${imageUrl || "https://picsum.photos/600/300"}" alt="${imageAlt}" class="max-w-full h-auto my-4 rounded-lg shadow-sm mx-auto" /><p>&nbsp;</p>`;
    insertHTMLAtCursor(imgHtml);
    setShowImageModal(false);
    setImageUrl("");
  };

  // Insert Logo Options
  const handleInsertLogo = (type: string) => {
    let logoHtml = "";
    if (type === "FGI") {
      logoHtml = `<div class="inline-block p-3 bg-blue-900 text-white rounded-lg font-sans font-extrabold tracking-tight text-lg select-none mr-2">FGI</div>`;
    } else if (type === "GOLD") {
      logoHtml = `<span class="inline-block p-2 bg-slate-900 rounded-full text-amber-500 mr-2 shadow-sm"><svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></span>`;
    } else {
      logoHtml = `<span class="inline-block p-2 bg-indigo-50 text-indigo-700 rounded-lg mr-2 border border-indigo-150"><svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l9 4.91v9.82L12 22l-9-5.27V6.91L12 2z"/></svg></span>`;
    }
    insertHTMLAtCursor(logoHtml);
    setShowLogoModal(false);
  };

  // Insert Signature
  const handleInsertSignature = () => {
    const sigHtml = `
      <div class="my-6 text-left max-w-xs font-sans select-none">
        <p class="text-xs text-slate-400">Hormat kami,</p>
        <div class="my-3 h-14 border-b border-dashed border-indigo-300 w-36 flex items-center justify-center text-[10px] text-indigo-600 font-mono">
          <svg class="w-24 h-12 text-blue-850" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 25C25 15 45 5 60 20C75 35 30 40 20 20C10 0 70 8 90 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <p class="font-bold text-slate-900 underline text-xs">${sigName}</p>
        <p class="text-[10px] text-slate-500">${sigTitle}</p>
      </div>
    `;
    insertHTMLAtCursor(sigHtml);
    setShowSignatureModal(false);
  };

  // Insert QR Code
  const handleInsertQr = () => {
    const qrHtml = `
      <div class="inline-flex items-center gap-3 p-3 border border-blue-200 bg-blue-50/50 rounded-xl my-3 font-mono text-[9px] text-blue-800 select-none">
        <svg class="w-10 h-10 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="1" width="6" height="6" />
          <rect x="17" y="1" width="6" height="6" />
          <rect x="1" y="17" width="6" height="6" />
          <rect x="17" y="17" width="6" height="6" />
          <path d="M10 4h2M4 10v4M10 10h4v4M16 10v4M12 16v4" />
        </svg>
        <div class="leading-tight">
          <p class="font-bold text-[10px]">TTE DIGITAL VERIFIED</p>
          <p class="text-slate-500 font-mono mt-0.5">${qrText}</p>
          <span class="inline-block mt-1 px-1 bg-emerald-100 text-emerald-800 rounded text-[7px] font-bold">e-Sign Certified</span>
        </div>
      </div>
    `;
    insertHTMLAtCursor(qrHtml);
    setShowQrModal(false);
  };

  // Insert Barcode
  const handleInsertBarcode = () => {
    const bcHtml = `
      <div class="inline-block text-center my-3 font-mono text-[9px] text-slate-700 p-2.5 border border-slate-200 bg-slate-50/80 rounded select-none">
        <svg class="w-40 h-8" viewBox="0 0 100 24" preserveAspectRatio="none">
          <rect x="5" y="2" width="2" height="20" fill="currentColor" />
          <rect x="9" y="2" width="4" height="20" fill="currentColor" />
          <rect x="15" y="2" width="1" height="20" fill="currentColor" />
          <rect x="18" y="2" width="3" height="20" fill="currentColor" />
          <rect x="23" y="2" width="2" height="20" fill="currentColor" />
          <rect x="27" y="2" width="5" height="20" fill="currentColor" />
          <rect x="34" y="2" width="1" height="20" fill="currentColor" />
          <rect x="37" y="2" width="2" height="20" fill="currentColor" />
          <rect x="41" y="2" width="4" height="20" fill="currentColor" />
          <rect x="47" y="2" width="1" height="20" fill="currentColor" />
          <rect x="50" y="2" width="3" height="20" fill="currentColor" />
          <rect x="55" y="2" width="2" height="20" fill="currentColor" />
          <rect x="59" y="2" width="5" height="20" fill="currentColor" />
          <rect x="66" y="2" width="1" height="20" fill="currentColor" />
        </svg>
        <p class="mt-1 tracking-widest font-mono text-[8px]">${barcodeText}</p>
      </div>
    `;
    insertHTMLAtCursor(bcHtml);
    setShowBarcodeModal(false);
  };

  // Insert Hyperlink
  const handleInsertHyperlink = () => {
    const linkHtml = `<a href="${hyperlinkUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-semibold hover:text-blue-800">${hyperlinkText || hyperlinkUrl}</a>`;
    insertHTMLAtCursor(linkHtml);
    setShowHyperlinkModal(false);
  };

  // Insert Checklist
  const handleInsertChecklist = () => {
    const checkHtml = `
      <ul class="list-none pl-5 my-2">
        <li class="flex items-center gap-2.5 my-1 text-slate-800">
          <input type="checkbox" class="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" />
          <span>Tindak lanjut / Tugas checklist</span>
        </li>
      </ul>
    `;
    insertHTMLAtCursor(checkHtml);
  };

  // Insert Page Break
  const handleInsertPageBreak = () => {
    const breakHtml = `
      <div class="my-6 border-b-2 border-dashed border-rose-350 relative select-none page-break-element print:hidden" style="page-break-after: always; break-after: page;">
        <span class="absolute right-2 -top-2.5 bg-rose-100 text-rose-800 text-[8px] font-extrabold px-2 py-0.5 rounded tracking-wide font-sans">BATAS CETAKAN HALAMAN BARU (PAGE BREAK)</span>
      </div>
      <p>&nbsp;</p>
    `;
    insertHTMLAtCursor(breakHtml);
  };

  // Clipboard operations
  const handleClipboardCopy = () => {
    restoreSelection();
    document.execCommand("copy");
    alert("Salin berhasil! Konten telah disalin ke papan klip Anda.");
  };

  const handleClipboardCut = () => {
    restoreSelection();
    document.execCommand("cut");
    alert("Potong berhasil!");
  };

  const handleClipboardPaste = async () => {
    restoreSelection();
    try {
      const text = await navigator.clipboard.readText();
      insertHTMLAtCursor(text);
    } catch (err) {
      alert("Silakan gunakan tombol keyboard Pintas Ctrl+V (atau Cmd+V) untuk menempel langsung.");
    }
  };

  // Find & Replace Logic
  const handleFindReplaceAction = (replaceAll = false) => {
    if (!editorRef.current || !findText.trim()) return;
    const content = editorRef.current.innerHTML;
    
    if (replaceAll) {
      const escapedFind = findText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escapedFind, "g");
      editorRef.current.innerHTML = content.replace(regex, replaceText);
      alert(`Berhasil mengganti seluruh (${findText}) dengan (${replaceText}).`);
    } else {
      const idx = content.indexOf(findText);
      if (idx !== -1) {
        editorRef.current.innerHTML = content.replace(findText, replaceText);
        alert(`Berhasil mengganti satu kata pertama "${findText}" dengan "${replaceText}".`);
      } else {
        alert(`Kata "${findText}" tidak ditemukan dalam naskah.`);
      }
    }
    triggerEditorChange();
  };

  // Generate Base64 SVG Watermark
  const getWatermarkStyle = () => {
    if (!watermark) return {};
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='150px' width='150px'><text transform='translate(15, 110) rotate(-45)' fill='rgba(239, 68, 68, 0.08)' font-size='13' font-weight='bold' font-family='sans-serif'>${watermark}</text></svg>`;
    const base64Svg = btoa(svg);
    return {
      backgroundImage: `url("data:image/svg+xml;base64,${base64Svg}")`,
      backgroundRepeat: "repeat"
    };
  };

  // EXPORT HTML ACTION
  const exportToHTML = () => {
    if (!editorRef.current) return;
    const coreContent = editorRef.current.innerHTML;
    const fullHtmlDoc = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Naskah Surat Resmi</title>
        <style>
          body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 40px auto; padding: 20px; }
          .letter-header { border-bottom: 3px double #1e293b; padding-bottom: 12px; margin-bottom: 24px; text-align: center; }
          .letter-footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #64748b; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
          blockquote { border-left: 4px solid #3b82f6; padding-left: 16px; margin: 16px 0; font-style: italic; color: #475569; background: #f8fafc; padding-top: 8px; padding-bottom: 8px; }
          .page-break-element { page-break-after: always; break-after: page; border: none; height: 0; }
        </style>
      </head>
      <body>
        ${headerText ? `<div class="letter-header"><h3>${headerText}</h3></div>` : ""}
        <div class="content-body">
          ${coreContent}
        </div>
        ${footerText ? `<div class="letter-footer"><p>${footerText}</p></div>` : ""}
      </body>
      </html>
    `;
    
    const blob = new Blob([fullHtmlDoc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Draft_Surat_Forsdig_${new Date().getTime()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // EXPORT DOCX (Word Document mime type)
  const exportToDOCX = () => {
    if (!editorRef.current) return;
    const coreContent = editorRef.current.innerHTML;
    const fullWordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Naskah Surat Resmi DOCX</title>
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid #333333; padding: 8px; }
        </style>
      </head>
      <body>
        ${headerText ? `<h2>${headerText}</h2><hr/>` : ""}
        ${coreContent}
        ${footerText ? `<hr/><p style="font-size:10px; color:#666666">${footerText}</p>` : ""}
      </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff' + fullWordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Draft_Surat_Forsdig_${new Date().getTime()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // PRINT / EXPORT PDF trigger
  const triggerPrintPDF = () => {
    if (!editorRef.current) return;
    const coreContent = editorRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak & Ekspor PDF e-Office</title>
            <style>
              body { font-family: 'Inter', Arial, sans-serif; padding: 50px; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; position: relative; }
              ${watermark ? `
              body::before {
                content: "${watermark}";
                position: fixed;
                top: 30%;
                left: 10%;
                right: 10%;
                font-size: 60px;
                font-weight: 900;
                color: rgba(239, 68, 68, 0.06);
                text-align: center;
                transform: rotate(-35deg);
                pointer-events: none;
                z-index: -10;
                font-family: sans-serif;
              }
              ` : ""}
              .header-bar { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 30px; }
              .header-content { display: flex; align-items: center; }
              .logo { background-color: #1e3a8a; color: white; padding: 10px; font-weight: 800; border-radius: 6px; margin-right: 15px; font-size: 14px; }
              .footer-bar { margin-top: 50px; border-top: 1px solid #cbd5e1; padding-top: 10px; text-align: center; font-size: 10px; color: #64748b; }
              table { border-collapse: collapse; width: 100%; margin: 20px 0; }
              th, td { border: 1px solid #94a3b8; padding: 8px; text-align: left; }
              blockquote { border-left: 4px solid #2563eb; padding-left: 16px; font-style: italic; color: #475569; background-color: #f8fafc; padding: 10px 16px; margin: 15px 0; }
              .page-break-element { page-break-after: always; break-after: page; border: none; height: 0; }
            </style>
          </head>
          <body>
            ${headerText ? `<div class="header-bar"><div class="header-content"><div class="logo">FGI</div><div><strong>${headerText}</strong><p style="margin: 3px 0 0 0; font-size: 10px; color: #64748b;">Aplikasi Korespondensi Digital Terpadu</p></div></div></div>` : ""}
            <div class="content">
              ${coreContent}
            </div>
            ${footerText ? `<div class="footer-bar">${footerText} ${usePageNumbers ? `<span style="float: right">Hal. 1</span>` : ""}</div>` : ""}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => { window.close(); }, 500);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 overflow-hidden flex flex-col w-full shadow-sm text-xs md:text-sm">
      
      {/* RICH TEXT EDITOR TOOLBAR */}
      <div className="p-3 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 space-y-2 flex flex-col sticky top-0 z-30 select-none">
        
        {/* ROW 1: System, History, Typography Dropdowns */}
        <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-850">
          
          {/* Clipboard & History Group */}
          <div className="flex items-center space-x-1 border-r border-slate-200 dark:border-slate-800 pr-1.5 shrink-0">
            <button 
              type="button" 
              onClick={() => executeCommand("undo")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 transition" 
              title="Undo (Urungkan)"
            >
              <Undo className="h-3.5 w-3.5" />
            </button>
            <button 
              type="button" 
              onClick={() => executeCommand("redo")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 transition" 
              title="Redo (Ulangi)"
            >
              <Redo className="h-3.5 w-3.5" />
            </button>
            <button 
              type="button" 
              onClick={handleClipboardCopy}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 transition" 
              title="Copy (Salin)"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button 
              type="button" 
              onClick={handleClipboardCut}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 transition" 
              title="Cut (Potong)"
            >
              <Scissors className="h-3.5 w-3.5" />
            </button>
            <button 
              type="button" 
              onClick={handleClipboardPaste}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 transition" 
              title="Paste (Tempel)"
            >
              <Clipboard className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Typography: Font Family Dropdown */}
          <div className="flex items-center space-x-1 shrink-0">
            <select
              value={fontFamily}
              onChange={(e) => {
                setFontFamily(e.target.value);
                executeCommand("fontName", e.target.value);
              }}
              onFocus={saveSelection}
              className="h-7 text-[10px] font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[100px]"
              title="Font Family"
            >
              <option value="Inter">Inter (Sans)</option>
              <option value="Space Grotesk">Space Grotesk</option>
              <option value="JetBrains Mono">JetBrains Mono</option>
              <option value="Playfair Display">Playfair Serif</option>
              <option value="Arial">Arial</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier</option>
            </select>
          </div>

          {/* Typography: Font Size Dropdown */}
          <div className="flex items-center space-x-1 shrink-0">
            <select
              value={fontSize}
              onChange={(e) => {
                setFontSize(e.target.value);
                applyStyleToSelection("font-size", e.target.value);
              }}
              onFocus={saveSelection}
              className="h-7 text-[10px] font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-[65px]"
              title="Font Size"
            >
              <option value="11px">11px</option>
              <option value="12px">12px</option>
              <option value="13px">13px</option>
              <option value="14px">14px</option>
              <option value="16px">16px</option>
              <option value="18px">18px</option>
              <option value="20px">20px</option>
              <option value="24px">24px</option>
              <option value="30px">30px</option>
              <option value="36px">36px</option>
              <option value="48px">48px</option>
              <option value="72px">72px</option>
            </select>
          </div>

          {/* Line Height Selector */}
          <div className="flex items-center space-x-1 shrink-0">
            <select
              value={lineHeight}
              onChange={(e) => {
                setLineHeight(e.target.value);
                applyStyleToSelection("line-height", e.target.value);
              }}
              onFocus={saveSelection}
              className="h-7 text-[10px] font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-[65px]"
              title="Line Height (Jarak Baris)"
            >
              <option value="1.0">Single</option>
              <option value="1.15">1.15</option>
              <option value="1.5">1.5</option>
              <option value="1.8">1.8</option>
              <option value="2.0">Double</option>
              <option value="2.5">2.5</option>
              <option value="3.0">Triple</option>
            </select>
          </div>

          {/* Paragraph Style block Dropdown */}
          <div className="flex items-center space-x-1 shrink-0 border-r border-slate-200 dark:border-slate-800 pr-1.5">
            <select
              value={textBlock}
              onChange={(e) => {
                setTextBlock(e.target.value);
                executeCommand("formatBlock", e.target.value);
              }}
              onFocus={saveSelection}
              className="h-7 text-[10px] font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[85px]"
              title="Format Paragraf & Header"
            >
              <option value="<p>">Paragraf</option>
              <option value="<h1>">Judul H1</option>
              <option value="<h2>">Subjudul H2</option>
              <option value="<h3>">Heading H3</option>
              <option value="<h4>">Heading H4</option>
              <option value="<h5>">Heading H5</option>
              <option value="<h6>">Heading H6</option>
              <option value="<blockquote>">Kutipan</option>
            </select>
          </div>

          {/* Advanced: Find & Replace Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFindReplace(!showFindReplace)}
            className={`p-1.5 h-7 rounded flex items-center space-x-1.5 text-[10px] font-bold border transition ${showFindReplace ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-900" : "bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"}`}
            title="Temukan & Ganti Kata"
          >
            <Search className="h-3 w-3" />
            <span>Cari / Ganti</span>
          </button>

          {/* AI Drafting integration shortcut (if callback exists) */}
          {onAiDraftClick && (
            <button
              type="button"
              onClick={onAiDraftClick}
              className="ml-auto bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 h-7 rounded text-[10px] font-bold flex items-center gap-1 transition"
            >
              <Sparkles className="h-3 w-3 text-blue-500" />
              <span>Draf AI</span>
            </button>
          )}

        </div>

        {/* ROW 2: Inline Styles, Alignment, Lists, Indents, Colors */}
        <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-850">
          
          {/* Style Modifiers Group */}
          <div className="flex items-center space-x-0.5 border-r border-slate-200 dark:border-slate-800 pr-1.5 shrink-0">
            <button 
              type="button" 
              onClick={() => executeCommand("bold")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold" 
              title="Bold (Tebal) - Ctrl+B"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button 
              type="button" 
              onClick={() => executeCommand("italic")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 italic" 
              title="Italic (Miring) - Ctrl+I"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
            <button 
              type="button" 
              onClick={() => executeCommand("underline")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 underline" 
              title="Underline (Garis Bawah) - Ctrl+U"
            >
              <Underline className="h-3.5 w-3.5" />
            </button>
            <button 
              type="button" 
              onClick={() => executeCommand("strikeThrough")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 line-through" 
              title="Strikethrough (Coret Tengah)"
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </button>
            <button 
              type="button" 
              onClick={() => executeCommand("superscript")}
              className="p-1.5 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold text-[10px]" 
              title="Superscript"
            >
              X<sup>2</sup>
            </button>
            <button 
              type="button" 
              onClick={() => executeCommand("subscript")}
              className="p-1.5 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold text-[10px]" 
              title="Subscript"
            >
              X<sub>2</sub>
            </button>
          </div>

          {/* Color pickers */}
          <div className="flex items-center space-x-1.5 border-r border-slate-200 dark:border-slate-800 pr-1.5 shrink-0 text-[10px] font-semibold">
            {/* Fore Color selection */}
            <div className="flex items-center space-x-1" title="Warna Teks">
              <span className="text-slate-400">Teks:</span>
              <input 
                type="color" 
                value={textColor}
                onChange={(e) => {
                  setTextColor(e.target.value);
                  executeCommand("foreColor", e.target.value);
                }}
                onFocus={saveSelection}
                className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
              />
            </div>

            {/* Hilite Color Selection */}
            <div className="flex items-center space-x-1" title="Highlight (Warna Latar Belakang Teks)">
              <span className="text-slate-400">Sorot:</span>
              <input 
                type="color" 
                value={bgColor === "transparent" ? "#ffffff" : bgColor}
                onChange={(e) => {
                  setBgColor(e.target.value);
                  executeCommand("hiliteColor", e.target.value);
                }}
                onFocus={saveSelection}
                className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
              />
            </div>
          </div>

          {/* Alignment Controls */}
          <div className="flex items-center space-x-0.5 border-r border-slate-200 dark:border-slate-800 pr-1.5 shrink-0">
            <button 
              type="button" 
              onClick={() => executeCommand("justifyLeft")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300" 
              title="Rata Kiri"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
            <button 
              type="button" 
              onClick={() => executeCommand("justifyCenter")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300" 
              title="Rata Tengah"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </button>
            <button 
              type="button" 
              onClick={() => executeCommand("justifyRight")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300" 
              title="Rata Kanan"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </button>
            <button 
              type="button" 
              onClick={() => executeCommand("justifyFull")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300" 
              title="Rata Kanan Kiri (Justify)"
            >
              <AlignJustify className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Lists and Checkboxes */}
          <div className="flex items-center space-x-0.5 border-r border-slate-200 dark:border-slate-800 pr-1.5 shrink-0">
            <button 
              type="button" 
              onClick={() => executeCommand("insertUnorderedList")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300" 
              title="Bullet List (Daftar Poin)"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button 
              type="button" 
              onClick={() => executeCommand("insertOrderedList")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300" 
              title="Numbered List (Daftar Angka)"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </button>
            <button 
              type="button" 
              onClick={handleInsertChecklist}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300" 
              title="Checklist List (Daftar Centang)"
            >
              <CheckSquare className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Indentations Group */}
          <div className="flex items-center space-x-0.5 shrink-0">
            <button 
              type="button" 
              onClick={() => executeCommand("outdent")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold" 
              title="Kurangi Indentasi"
            >
              &lt; Indent
            </button>
            <button 
              type="button" 
              onClick={() => executeCommand("indent")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold" 
              title="Tambah Indentasi"
            >
              Indent &gt;
            </button>
          </div>

        </div>

        {/* ROW 3: Insert Tools */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg border border-slate-150 dark:border-slate-850">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mr-2 border-r border-slate-200 dark:border-slate-800 pr-2">Sisipkan (Insert)</span>
          
          <button
            type="button"
            onClick={() => { saveSelection(); setShowTableModal(true); }}
            className="px-2.5 h-6 rounded flex items-center space-x-1 text-[10px] font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition"
          >
            <Table className="h-3 w-3 text-amber-500" />
            <span>Tabel</span>
          </button>

          <button
            type="button"
            onClick={() => { saveSelection(); setShowImageModal(true); }}
            className="px-2.5 h-6 rounded flex items-center space-x-1 text-[10px] font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition"
          >
            <Image className="h-3 w-3 text-emerald-500" />
            <span>Gambar</span>
          </button>

          <button
            type="button"
            onClick={() => { saveSelection(); setShowLogoModal(true); }}
            className="px-2.5 h-6 rounded flex items-center space-x-1 text-[10px] font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition"
          >
            <LogoIcon className="h-3 w-3 text-indigo-500" />
            <span>Logo</span>
          </button>

          <button
            type="button"
            onClick={() => { saveSelection(); setShowSignatureModal(true); }}
            className="px-2.5 h-6 rounded flex items-center space-x-1 text-[10px] font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition"
          >
            <FileText className="h-3 w-3 text-teal-500" />
            <span>TTE Signature</span>
          </button>

          <button
            type="button"
            onClick={() => { saveSelection(); setShowQrModal(true); }}
            className="px-2.5 h-6 rounded flex items-center space-x-1 text-[10px] font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition"
          >
            <QrCode className="h-3 w-3 text-blue-500" />
            <span>QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => { saveSelection(); setShowBarcodeModal(true); }}
            className="px-2.5 h-6 rounded flex items-center space-x-1 text-[10px] font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition"
          >
            <Barcode className="h-3 w-3 text-purple-500" />
            <span>Barcode</span>
          </button>

          <button
            type="button"
            onClick={() => { saveSelection(); setShowHyperlinkModal(true); }}
            className="px-2.5 h-6 rounded flex items-center space-x-1 text-[10px] font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition"
          >
            <Link2 className="h-3 w-3 text-rose-500" />
            <span>Hyperlink</span>
          </button>

          <button
            type="button"
            onClick={() => executeCommand("insertHorizontalRule")}
            className="px-2.5 h-6 rounded flex items-center space-x-1 text-[10px] font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition"
            title="Garis Pembatas Horizontal"
          >
            <span>— Garis HR</span>
          </button>

          <button
            type="button"
            onClick={handleInsertPageBreak}
            className="px-2.5 h-6 rounded flex items-center space-x-1 text-[10px] font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 text-rose-600 transition"
            title="Sela Cetak Halaman Baru"
          >
            <span>📄 Page Break</span>
          </button>

        </div>

        {/* ROW 4: Page Configuration, Watermarks & Exports */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-850">
          
          {/* Watermark Selector Input */}
          <div className="flex items-center space-x-1 mr-2 text-[10px]">
            <span className="font-bold text-slate-450 uppercase tracking-wide">Watermark:</span>
            <input 
              type="text" 
              placeholder="e.g. DRAFT"
              value={watermark}
              onChange={(e) => setWatermark(e.target.value)}
              className="h-6 w-20 px-1.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Letter Head Input */}
          <div className="flex items-center space-x-1 mr-2 text-[10px]">
            <span className="font-bold text-slate-450 uppercase tracking-wide">Header:</span>
            <input 
              type="text" 
              placeholder="KOP Header..."
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              className="h-6 w-28 px-1.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Letter Footer Input */}
          <div className="flex items-center space-x-1 mr-2 text-[10px]">
            <span className="font-bold text-slate-450 uppercase tracking-wide">Footer:</span>
            <input 
              type="text" 
              placeholder="Kaki surat..."
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              className="h-6 w-28 px-1.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Use Page Numbers Toggle */}
          <label className="flex items-center gap-1 text-[10px] font-bold text-slate-650 cursor-pointer mr-2 select-none">
            <input 
              type="checkbox" 
              checked={usePageNumbers} 
              onChange={() => setUsePageNumbers(!usePageNumbers)}
              className="rounded text-blue-600 border-slate-300 focus:ring-blue-500"
            />
            <span>No Halaman</span>
          </label>

          {/* Action buttons: Print Preview & Outputs */}
          <div className="ml-auto flex items-center space-x-1.5 border-l border-slate-200 dark:border-slate-800 pl-2">
            
            <button
              type="button"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`px-2 h-6.5 rounded flex items-center space-x-1 text-[10px] font-extrabold transition-all border ${isPreviewMode ? "bg-amber-600 border-amber-600 text-white shadow-xs" : "bg-slate-100 hover:bg-slate-150 border-slate-200 text-slate-700 dark:bg-slate-850 dark:border-slate-750 dark:text-slate-300"}`}
              title="Pratinjau Layar Cetak penuh"
            >
              <Eye className="h-3 w-3" />
              <span>{isPreviewMode ? "Edit Mode" : "Print Preview"}</span>
            </button>

            <button
              type="button"
              onClick={triggerPrintPDF}
              className="px-2 h-6.5 bg-blue-600 hover:bg-blue-700 border border-blue-600 text-white rounded flex items-center space-x-1 text-[10px] font-extrabold transition-all"
              title="Print / Save PDF"
            >
              <Printer className="h-3 w-3" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={exportToDOCX}
              className="px-2 h-6.5 bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 text-white rounded flex items-center space-x-1 text-[10px] font-extrabold transition-all"
              title="Unduh draf berformat Word (.doc)"
            >
              <FileDown className="h-3 w-3" />
              <span>DOCX</span>
            </button>

            <button
              type="button"
              onClick={exportToHTML}
              className="px-2 h-6.5 bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 text-white rounded flex items-center space-x-1 text-[10px] font-extrabold transition-all"
              title="Ekspor sebagai HTML mandiri"
            >
              <span>HTML</span>
            </button>

          </div>

        </div>

      </div>

      {/* COLLAPSIBLE FIND & REPLACE PANEL */}
      {showFindReplace && (
        <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/40 grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end select-none animate-in slide-in-from-top-3 duration-150">
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-indigo-700 dark:text-indigo-400 mb-1">Cari Kata / Kalimat</label>
            <input 
              type="text"
              placeholder="Ketik kata yang dicari..."
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              className="w-full text-xs p-1.5 px-2.5 border border-indigo-200/60 dark:border-indigo-900 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-indigo-700 dark:text-indigo-400 mb-1">Ganti Dengan</label>
            <input 
              type="text"
              placeholder="Ketik kata pengganti..."
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              className="w-full text-xs p-1.5 px-2.5 border border-indigo-200/60 dark:border-indigo-900 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => handleFindReplaceAction(false)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg transition"
            >
              Ganti Pertama
            </button>
            <button
              type="button"
              onClick={() => handleFindReplaceAction(true)}
              className="flex-1 bg-indigo-850 hover:bg-indigo-900 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg transition border border-indigo-700/65"
            >
              Ganti Semua
            </button>
            <button
              type="button"
              onClick={() => setShowFindReplace(false)}
              className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-[10px] p-2 rounded-lg transition"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* EDITABLE PAPER CONTAINER (A4 STYLED WORKSPACE) */}
      <div className={`p-4 md:p-8 flex-1 bg-slate-150 dark:bg-slate-900/60 flex justify-center overflow-auto min-h-[380px] ${isPreviewMode ? "bg-slate-300" : ""}`}>
        
        {/* PHYSICAL PAPER SHEET */}
        <div 
          style={getWatermarkStyle()}
          className={`bg-white text-slate-800 p-8 md:p-12 border border-slate-300 dark:border-slate-800 rounded-md shadow-md w-full max-w-2xl font-serif min-h-[500px] flex flex-col justify-between transition-all relative ${isPreviewMode ? "shadow-2xl border-slate-400" : ""}`}
        >
          {/* Virtual Paper Header */}
          {headerText && (
            <div className="border-b-2 border-slate-800 pb-3 mb-6 text-center text-xs font-sans tracking-wide uppercase text-slate-700 font-extrabold select-none">
              {headerText}
            </div>
          )}

          {/* EDITABLE WRAPPER */}
          <div 
            ref={editorRef}
            contentEditable={!isPreviewMode}
            onInput={handleEditorInput}
            onBlur={triggerEditorChange}
            onMouseUp={saveSelection}
            onKeyUp={saveSelection}
            id="rich-editor-canvas"
            className={`flex-1 font-sans text-xs md:text-sm text-slate-850 leading-relaxed outline-none min-h-[300px] whitespace-normal rich-text-preview ${isPreviewMode ? "cursor-not-allowed select-text" : "focus:ring-0 cursor-text"}`}
            placeholder={placeholder}
          />

          {/* Virtual Paper Footer */}
          {(footerText || usePageNumbers) && (
            <div className="border-t border-slate-150 pt-3 mt-8 flex justify-between text-[10px] font-sans text-slate-400 select-none uppercase tracking-wide">
              <span>{footerText}</span>
              {usePageNumbers && <span className="font-bold">Halaman 1</span>}
            </div>
          )}
        </div>

      </div>

      {/* FOOTER COUNT BAR */}
      <div className="p-2.5 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-semibold select-none">
        <div className="flex space-x-4">
          <span className="flex items-center gap-1">
            <strong>Jumlah Kata:</strong> 
            <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400">{wordCount}</span>
          </span>
          <span className="flex items-center gap-1">
            <strong>Karakter:</strong> 
            <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">{charCount}</span>
          </span>
        </div>
        
        <div className="flex items-center space-x-1 text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Editor Siap</span>
        </div>
      </div>

      {/* MODAL DIALOGS FOR RICH INSERTS */}
      
      {/* 1. Insert Table Dialog */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xl w-full max-w-xs animate-in zoom-in-95 duration-100">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-3">Sisipkan Tabel Dinamis</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Jumlah Baris (Rows)</label>
                <input 
                  type="number" 
                  min={1} 
                  max={20}
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Jumlah Kolom (Columns)</label>
                <input 
                  type="number" 
                  min={1} 
                  max={10}
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowTableModal(false)}
                  className="flex-1 py-2 text-xs border border-slate-200 dark:border-slate-800 text-slate-500 rounded font-semibold hover:bg-slate-100 dark:hover:bg-slate-850"
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  onClick={handleInsertTable}
                  className="flex-1 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
                >
                  Sisipkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Insert Image Dialog */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xl w-full max-w-sm animate-in zoom-in-95 duration-100">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-3">Sisipkan Gambar Baru</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">URL Sumber Gambar</label>
                <input 
                  type="text" 
                  placeholder="https://example.com/logo.png"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Deskripsi Alternatif (Alt Text)</label>
                <input 
                  type="text" 
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowImageModal(false)}
                  className="flex-1 py-2 text-xs border border-slate-200 dark:border-slate-800 text-slate-500 rounded font-semibold hover:bg-slate-100 dark:hover:bg-slate-850"
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  onClick={handleInsertImage}
                  className="flex-1 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
                >
                  Sisipkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Insert Logo Options Dialog */}
      {showLogoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xl w-full max-w-sm animate-in zoom-in-95 duration-100">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-3">Pilih Logo Perusahaan Untuk Disisipkan</h4>
            <div className="grid grid-cols-3 gap-3.5 pt-2">
              <button 
                onClick={() => handleInsertLogo("FGI")}
                className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/10 flex flex-col items-center gap-2"
              >
                <div className="p-2 bg-blue-900 text-white rounded text-[10px] font-extrabold select-none">FGI</div>
                <span className="text-[10px] font-bold">FGI Badge</span>
              </button>
              <button 
                onClick={() => handleInsertLogo("GOLD")}
                className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/10 flex flex-col items-center gap-2"
              >
                <div className="text-amber-500 bg-slate-900 p-1.5 rounded-full"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
                <span className="text-[10px] font-bold">Gold Crest</span>
              </button>
              <button 
                onClick={() => handleInsertLogo("TECH")}
                className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/10 flex flex-col items-center gap-2"
              >
                <div className="text-indigo-700 bg-indigo-50 p-1.5 rounded-md border border-indigo-150"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l9 4.91v9.82L12 22l-9-5.27V6.91L12 2z"/></svg></div>
                <span className="text-[10px] font-bold">Tech Diamond</span>
              </button>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button 
                onClick={() => setShowLogoModal(false)}
                className="px-4 py-2 text-xs border border-slate-200 dark:border-slate-800 text-slate-500 font-semibold rounded hover:bg-slate-100 dark:hover:bg-slate-850"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Insert Signature Dialog */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xl w-full max-w-sm animate-in zoom-in-95 duration-100">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-3">Papan Tanda Tangan Konseptor</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Nama Pejabat</label>
                <input 
                  type="text" 
                  value={sigName}
                  onChange={(e) => setSigName(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Jabatan / Pangkat</label>
                <input 
                  type="text" 
                  value={sigTitle}
                  onChange={(e) => setSigTitle(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowSignatureModal(false)}
                  className="flex-1 py-2 text-xs border border-slate-200 dark:border-slate-800 text-slate-500 rounded font-semibold hover:bg-slate-100 dark:hover:bg-slate-850"
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  onClick={handleInsertSignature}
                  className="flex-1 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
                >
                  Sisipkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Insert QR Code Dialog */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xl w-full max-w-sm animate-in zoom-in-95 duration-100">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-3">Sisipkan QR Code Verifikasi</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Data Konten Sandi QR (URL / Metadata)</label>
                <input 
                  type="text" 
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowQrModal(false)}
                  className="flex-1 py-2 text-xs border border-slate-200 dark:border-slate-800 text-slate-500 rounded font-semibold hover:bg-slate-100 dark:hover:bg-slate-850"
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  onClick={handleInsertQr}
                  className="flex-1 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
                >
                  Sisipkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Insert Barcode Dialog */}
      {showBarcodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xl w-full max-w-sm animate-in zoom-in-95 duration-100">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-3">Sisipkan Barcode Klasifikasi</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Nomor / Kode Barcode</label>
                <input 
                  type="text" 
                  value={barcodeText}
                  onChange={(e) => setBarcodeText(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowBarcodeModal(false)}
                  className="flex-1 py-2 text-xs border border-slate-200 dark:border-slate-800 text-slate-500 rounded font-semibold hover:bg-slate-100 dark:hover:bg-slate-850"
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  onClick={handleInsertBarcode}
                  className="flex-1 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
                >
                  Sisipkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Insert Hyperlink Dialog */}
      {showHyperlinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xl w-full max-w-sm animate-in zoom-in-95 duration-100">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-3">Sisipkan Tautan Hyperlink</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Alamat Link (URL)</label>
                <input 
                  type="text" 
                  value={hyperlinkUrl}
                  onChange={(e) => setHyperlinkUrl(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Teks Tampilan (Display Text)</label>
                <input 
                  type="text" 
                  value={hyperlinkText}
                  onChange={(e) => setHyperlinkText(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowHyperlinkModal(false)}
                  className="flex-1 py-2 text-xs border border-slate-200 dark:border-slate-800 text-slate-500 rounded font-semibold hover:bg-slate-100 dark:hover:bg-slate-850"
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  onClick={handleInsertHyperlink}
                  className="flex-1 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
                >
                  Sisipkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
