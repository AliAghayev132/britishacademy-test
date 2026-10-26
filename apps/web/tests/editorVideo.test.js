import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Video } from "@/components/editor/parts/VideoExtension";

/**
 * REDAKTORDA VİDEO.
 *
 * ── TAPILAN NASAZLIQ ──
 * `VideoMenu` videonu hazır HTML kimi yerləşdirirdi:
 *   <div data-video-wrapper="true"><video controls src="…"></video></div>
 * Sxemdə `video` node-u YOX idi (yalnız YouTube uzantısı vardı) — ProseMirror
 * bu HTML-i tanımırdı və redaktorda onu VİDEO yox, düz MƏTN kimi göstərirdi.
 * İctimai saytda isə problem yox idi: `sanitizeHtml` <video>-nu buraxır.
 *
 * Brauzerdə ölçüldü: istifadəçinin göndərdiyi dəqiq HTML indi 1 <video>
 * elementi kimi açılır, canlıdakı 38.6 saniyəlik fayl yüklənir, getHTML eyni
 * sarğını qaytarır.
 */

const schema = getSchema([StarterKit, Video]);
const spec = schema.nodes.video?.spec;

describe("video node-u", () => {
  it("sxemdə var — atom blok, sürüklənə bilər", () => {
    expect(schema.nodes.video).toBeTruthy();
    expect(spec.atom).toBe(true);
    expect(spec.group).toBe("block");
    expect(spec.draggable).toBe(true);
  });

  it("<video> teqini tanıyır — bazadakı köhnə məzmun da açılır", () => {
    expect(spec.parseDOM.some((r) => r.tag === "video")).toBe(true);
  });

  it("yadda saxlanan HTML ictimai saytın gözlədiyi formatdadır", () => {
    const node = schema.nodes.video.create({ src: "/uploads/videos/a.mp4" });
    const [tag, attrs, [inner, innerAttrs]] = spec.toDOM(node);
    expect(tag).toBe("div");
    expect(attrs["data-video-wrapper"]).toBe("true");
    expect(inner).toBe("video");
    expect(innerAttrs.src).toBe("/uploads/videos/a.mp4");
    expect(innerAttrs.controls).toBeTruthy();
  });

  it("redaktora aid `contenteditable` BAZAYA yazılmır", () => {
    // Bu atribut yalnız node view-dadır (redaktordakı görünüş). renderHTML-ə
    // düşsəydi hər yazının HTML-inə redaktor qalığı kimi yazılardı.
    const node = schema.nodes.video.create({ src: "/x.mp4" });
    expect(JSON.stringify(spec.toDOM(node))).not.toMatch(/contenteditable/);
  });

  it("src yoxdursa boş atribut yazılmır", () => {
    const [, , [, innerAttrs]] = spec.toDOM(schema.nodes.video.create({}));
    expect(innerAttrs).not.toHaveProperty("src");
    expect(innerAttrs).not.toHaveProperty("poster");
  });
});

describe("qoşulma", () => {
  it("uzantı redaktorun siyahısındadır", () => {
    const ext = fs.readFileSync("src/components/editor/parts/extensions.js", "utf8");
    expect(ext).toMatch(/import \{ Video \} from '\.\/VideoExtension';/);
    expect(ext).toMatch(/^\s+Video,$/m);
  });

  it("yükləmə node əmri ilə yerləşdirir, xam HTML sətri ilə yox", () => {
    const menu = fs.readFileSync("src/components/editor/parts/VideoMenu.jsx", "utf8");
    expect(menu).toMatch(/\.setVideo\(\{ src: url \}\)/);
    expect(menu).not.toMatch(/insertContent\(\s*`<div data-video-wrapper/);
  });

  it("ictimai səhifədə videonun hündürlüyü ekrana bağlanır", () => {
    // Şaquli telefon videosu 760px-lik sütunda ~1250px hündürlüyə çatırdı.
    const css = fs.readFileSync("src/styles/globals.css", "utf8");
    expect(css).toMatch(/\.bz-body video \{[^}]*max-height:75vh/);
  });
});
