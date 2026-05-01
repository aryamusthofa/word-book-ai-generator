import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, Header, Footer, PageNumber, Packer } from "docx";
import { saveAs } from "file-saver";

export async function exportToDocx(book: any) {
  const isID = book.lang === "id";
  const children: any[] = [];

  // ---- COVER PAGE ----
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "", break: 6 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: book.topic,
          bold: true,
          size: 56,
          font: "Cambria",
          color: "1A1A2E",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      children: [
        new TextRun({
          text: isID ? "— Buku Nonfiksi Edukatif —" : "— Educational Non-Fiction —",
          italics: true,
          size: 28,
          color: "6C63FF",
          font: "Cambria",
        }),
      ],
    })
  );

  if (book.authorName) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 800 },
        children: [
          new TextRun({
            text: (isID ? "Oleh: " : "By: ") + book.authorName,
            size: 28,
            font: "Calibri",
            color: "444444",
          }),
        ],
      })
    );
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      children: [
        new TextRun({
          text: new Date(book.createdAt).getFullYear().toString(),
          size: 24,
          font: "Calibri",
          color: "888888",
        }),
      ],
    }),
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // ---- TABLE OF CONTENTS ----
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: isID ? "Daftar Isi" : "Table of Contents", font: "Cambria", bold: true, color: "1A1A2E" })],
      spacing: { after: 300 },
    })
  );

  for (const ch of book.structure) {
    const chapKey = isID ? "bab" : "chapter";
    const titKey = isID ? "judul" : "title";
    const secKey = isID ? "subbab" : "sections";
    const codeKey = isID ? "kode" : "code";

    children.push(
      new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({
            text: (isID ? ("Bab " + ch[chapKey]) : ("Chapter " + ch[chapKey])) + " — " + ch[titKey],
            bold: true,
            size: 24,
            font: "Calibri",
            color: "333333",
          }),
        ],
      })
    );
    for (const sec of ch[secKey]) {
      children.push(
        new Paragraph({
          indent: { left: 720 },
          spacing: { after: 40 },
          children: [
            new TextRun({ text: sec[codeKey] + ". " + sec[isID ? "judul" : "title"], size: 20, font: "Calibri", color: "666666" }),
          ],
        })
      );
    }
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ---- CHAPTERS ----
  for (const ch of book.structure) {
    const chapKey = isID ? "bab" : "chapter";
    const titKey = isID ? "judul" : "title";
    const secKey = isID ? "subbab" : "sections";
    const codeKey = isID ? "kode" : "code";
    const secTitKey = isID ? "judul" : "title";

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
        spacing: { before: 0, after: 200 },
        children: [
          new TextRun({
            text: isID ? ("BAB " + ch[chapKey]) : ("CHAPTER " + ch[chapKey]),
            font: "Cambria",
            bold: true,
            size: 28,
            color: "6C63FF",
            allCaps: true,
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 0, after: 400 },
        children: [
          new TextRun({
            text: ch[titKey],
            font: "Cambria",
            bold: true,
            size: 40,
            color: "1A1A2E",
          }),
        ],
      })
    );

    for (const sec of ch[secKey]) {
      const sectionId = ch[chapKey] + "_" + sec[codeKey];
      const content = (book.content && book.content[sectionId]) || "";

      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 360, after: 160 },
          children: [
            new TextRun({
              text: sec[codeKey] + ". " + sec[secTitKey],
              font: "Cambria",
              bold: true,
              size: 28,
              color: "333333",
            }),
          ],
        })
      );

      const paragraphs = content.split(/\n\n+/).filter((p: string) => p.trim());
      for (const para of paragraphs) {
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 200, line: 360 },
            indent: { firstLine: 504 },
            children: [
              new TextRun({
                text: para.trim(),
                font: "Times New Roman",
                size: 24,
                color: "1a1a1a",
              }),
            ],
          })
        );
      }
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Times New Roman", size: 24 },
          paragraph: { spacing: { line: 360 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,
            bottom: 1440,
            left: 1800,
            right: 1440,
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: book.topic, font: "Calibri", size: 18, color: "888888", italics: true }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 18, color: "888888" }),
              ],
            }),
          ],
        }),
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const filename = book.topic.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_").slice(0, 60) + ".docx";
  saveAs(blob, filename);
  return filename;
}
