import json
import math
import os
import html
from PIL import Image, ImageDraw, ImageFont

BASE = os.path.dirname(__file__)
DIAGRAMS = os.path.join(BASE, "diagrams")


def make_ref(value):
    return {"$ref": value}


def font(size, bold=False):
    candidates = [
        "arialbd.ttf" if bold else "arial.ttf",
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            pass
    return ImageFont.load_default()


FONT = font(15)
SMALL = font(12)
TITLE = font(14)


def text_size(draw, text, fnt):
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def center_text(draw, box, text, fnt=FONT):
    x, y, w, h = box
    tw, th = text_size(draw, text, fnt)
    draw.text((x + (w - tw) / 2, y + (h - th) / 2), text, fill="black", font=fnt)


def line_intersection_ellipse(cx, cy, rx, ry, px, py):
    dx, dy = px - cx, py - cy
    denom = math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry)) or 1
    return cx + dx / denom, cy + dy / denom


def rect_edge(cx, cy, w, h, px, py):
    dx, dy = px - cx, py - cy
    if dx == 0 and dy == 0:
        return cx, cy
    scale = min((w / 2) / abs(dx) if dx else 10**9, (h / 2) / abs(dy) if dy else 10**9)
    return cx + dx * scale, cy + dy * scale


def draw_dashed(draw, start, end, width=1):
    x1, y1 = start
    x2, y2 = end
    length = max(1, math.hypot(x2 - x1, y2 - y1))
    dx, dy = (x2 - x1) / length, (y2 - y1) / length
    dash, gap = 8, 6
    cur = 0
    while cur < length:
        nxt = min(cur + dash, length)
        draw.line((x1 + dx * cur, y1 + dy * cur, x1 + dx * nxt, y1 + dy * nxt), fill="black", width=width)
        cur += dash + gap


def arrow_head(draw, start, end, filled=False, triangle=False):
    x1, y1 = start
    x2, y2 = end
    angle = math.atan2(y2 - y1, x2 - x1)
    size = 12 if not triangle else 16
    a1 = angle - math.pi / 7
    a2 = angle + math.pi / 7
    p1 = (x2 - size * math.cos(a1), y2 - size * math.sin(a1))
    p2 = (x2 - size * math.cos(a2), y2 - size * math.sin(a2))
    if triangle:
        draw.polygon([end, p1, p2], outline="black", fill="white")
    elif filled:
        draw.polygon([end, p1, p2], outline="black", fill="black")
    else:
        draw.line((p1[0], p1[1], x2, y2, p2[0], p2[1]), fill="black", width=1)


def draw_actor(draw, x, y, name):
    cx = x + 35
    top = y
    r = 10
    draw.ellipse((cx - r, top, cx + r, top + 2 * r), outline="black", width=1)
    neck = top + 2 * r
    body = neck + 28
    draw.line((cx, neck, cx, body), fill="black", width=1)
    draw.line((cx - 22, neck + 10, cx + 22, neck + 10), fill="black", width=1)
    draw.line((cx, body, cx - 20, body + 26), fill="black", width=1)
    draw.line((cx, body, cx + 20, body + 26), fill="black", width=1)
    tw, _ = text_size(draw, name, SMALL)
    draw.text((cx - tw / 2, body + 29), name, fill="black", font=SMALL)
    draw.line((cx - 34, body + 45, cx + 34, body + 45), fill="black", width=1)
    draw.line((cx - 34, body + 49, cx + 34, body + 49), fill="black", width=1)


def draw_grid(draw, width, height):
    for x in range(0, width, 22):
        draw.line((x, 0, x, height), fill=(232, 232, 232), width=1)
    for y in range(0, height, 22):
        draw.line((0, y, width, y), fill=(232, 232, 232), width=1)


def clean_name(name):
    return name.replace("é", "e").replace("è", "e").replace("ê", "e").replace("à", "a")


class MdjBuilder:
    def __init__(self, title):
        self.counter = 0
        self.project_id = self.new_id("project")
        self.model_id = self.new_id("model")
        self.diagram_id = self.new_id("useCaseDiagram")
        self.subject_id = self.new_id("subject")
        self.title = title
        self.elements = []
        self.views = []
        self.actor_ids = {}
        self.usecase_ids = {}
        self.actor_view_ids = {}
        self.usecase_view_ids = {}

    def new_id(self, prefix):
        self.counter += 1
        return f"{prefix}_{self.counter}"

    def add_actor(self, name, x, y):
        actor_id = self.new_id("actor")
        view_id = self.new_id("actorView")
        label_id = self.new_id("label")
        name_id = self.new_id("nameComp")
        self.actor_ids[name] = actor_id
        self.actor_view_ids[name] = view_id
        self.elements.append({
            "_type": "UMLActor",
            "_id": actor_id,
            "_parent": make_ref(self.model_id),
            "name": name,
            "ownedElements": [],
        })
        self.views.append({
            "_type": "UMLActorView",
            "_id": view_id,
            "_parent": make_ref(self.diagram_id),
            "model": make_ref(actor_id),
            "subViews": [{
                "_type": "UMLNameCompartmentView",
                "_id": name_id,
                "_parent": make_ref(view_id),
                "model": make_ref(actor_id),
                "subViews": [{
                    "_type": "LabelView",
                    "_id": label_id,
                    "_parent": make_ref(name_id),
                    "font": "Arial;13;0",
                    "left": x - 10,
                    "top": y + 72,
                    "width": 90,
                    "height": 16,
                    "text": name,
                }],
                "font": "Arial;13;0",
                "left": x - 10,
                "top": y + 68,
                "width": 90,
                "height": 28,
                "nameLabel": make_ref(label_id),
            }],
            "font": "Arial;13;0",
            "left": x,
            "top": y,
            "width": 70,
            "height": 96,
            "nameCompartment": make_ref(name_id),
            "lineColor": "#000000",
        })

    def add_usecase(self, name, x, y, w=190, h=48):
        uc_id = self.new_id("usecase")
        view_id = self.new_id("useCaseView")
        label_id = self.new_id("label")
        self.usecase_ids[name] = uc_id
        self.usecase_view_ids[name] = view_id
        self.elements.append({
            "_type": "UMLUseCase",
            "_id": uc_id,
            "_parent": make_ref(self.model_id),
            "name": name,
        })
        self.views.append({
            "_type": "UMLUseCaseView",
            "_id": view_id,
            "_parent": make_ref(self.diagram_id),
            "model": make_ref(uc_id),
            "subViews": [{
                "_type": "LabelView",
                "_id": label_id,
                "_parent": make_ref(view_id),
                "font": "Arial;13;0",
                "left": x + 12,
                "top": y + h / 2 - 8,
                "width": w - 24,
                "height": 16,
                "text": name,
            }],
            "font": "Arial;13;0",
            "left": x,
            "top": y,
            "width": w,
            "height": h,
            "fillColor": "#FFFFFF",
            "lineColor": "#000000",
        })

    def add_subject(self, x, y, w, h):
        self.views.insert(0, {
            "_type": "UMLUseCaseSubjectView",
            "_id": self.new_id("subjectView"),
            "_parent": make_ref(self.diagram_id),
            "model": make_ref(self.subject_id),
            "left": x,
            "top": y,
            "width": w,
            "height": h,
            "font": "Arial;13;0",
            "lineColor": "#000000",
        })

    def add_assoc(self, actor, usecase):
        if actor not in self.actor_ids or usecase not in self.usecase_ids:
            return
        assoc_id = self.new_id("assoc")
        self.elements.append({
            "_type": "UMLAssociation",
            "_id": assoc_id,
            "_parent": make_ref(self.model_id),
            "name": "",
            "end1": {"_type": "UMLAssociationEnd", "_id": self.new_id("end"), "_parent": make_ref(assoc_id), "reference": make_ref(self.actor_ids[actor]), "navigable": False},
            "end2": {"_type": "UMLAssociationEnd", "_id": self.new_id("end"), "_parent": make_ref(assoc_id), "reference": make_ref(self.usecase_ids[usecase]), "navigable": True},
        })
        self.views.append({
            "_type": "UMLAssociationView",
            "_id": self.new_id("assocView"),
            "_parent": make_ref(self.diagram_id),
            "model": make_ref(assoc_id),
            "tail": make_ref(self.actor_view_ids[actor]),
            "head": make_ref(self.usecase_view_ids[usecase]),
            "lineColor": "#000000",
        })

    def add_generalization(self, child, parent):
        if child not in self.actor_ids or parent not in self.actor_ids:
            return
        gen_id = self.new_id("generalization")
        self.elements.append({
            "_type": "UMLGeneralization",
            "_id": gen_id,
            "_parent": make_ref(self.model_id),
            "source": make_ref(self.actor_ids[child]),
            "target": make_ref(self.actor_ids[parent]),
        })
        self.views.append({
            "_type": "UMLGeneralizationView",
            "_id": self.new_id("generalizationView"),
            "_parent": make_ref(self.diagram_id),
            "model": make_ref(gen_id),
            "tail": make_ref(self.actor_view_ids[child]),
            "head": make_ref(self.actor_view_ids[parent]),
            "lineColor": "#000000",
        })

    def add_relation(self, source, target, rel_type):
        if source not in self.usecase_ids or target not in self.usecase_ids:
            return
        rel_id = self.new_id(rel_type)
        uml_type = "UMLInclude" if rel_type == "include" else "UMLExtend"
        view_type = "UMLIncludeView" if rel_type == "include" else "UMLExtendView"
        self.elements.append({
            "_type": uml_type,
            "_id": rel_id,
            "_parent": make_ref(self.model_id),
            "source": make_ref(self.usecase_ids[source]),
            "target": make_ref(self.usecase_ids[target]),
        })
        self.views.append({
            "_type": view_type,
            "_id": self.new_id(f"{rel_type}View"),
            "_parent": make_ref(self.diagram_id),
            "model": make_ref(rel_id),
            "tail": make_ref(self.usecase_view_ids[source]),
            "head": make_ref(self.usecase_view_ids[target]),
            "lineColor": "#000000",
            "lineStyle": 1,
        })

    def project(self):
        return {
            "_type": "Project",
            "_id": self.project_id,
            "name": self.title,
            "ownedElements": [{
                "_type": "UMLModel",
                "_id": self.model_id,
                "_parent": make_ref(self.project_id),
                "name": "GOSPORT - Cas d'utilisation",
                "ownedElements": [{
                    "_type": "UMLUseCaseDiagram",
                    "_id": self.diagram_id,
                    "_parent": make_ref(self.model_id),
                    "name": self.title,
                    "defaultDiagram": True,
                    "ownedViews": self.views,
                }, {
                    "_type": "UMLUseCaseSubject",
                    "_id": self.subject_id,
                    "_parent": make_ref(self.model_id),
                    "name": "Plateforme GOSPORT",
                }, *self.elements],
            }],
        }


def render(spec, output):
    width, height = spec.get("size", (1280, 900))
    img = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(img)
    draw_grid(draw, width, height)

    sx, sy, sw, sh = spec["subject"]
    draw.rectangle((sx, sy, sx + sw, sy + sh), outline="black", width=2)
    center_text(draw, (sx, sy + 8, sw, 18), "Plateforme GOSPORT", TITLE)

    actors = spec["actors"]
    usecases = spec["usecases"]
    for name, (x, y) in actors.items():
        draw_actor(draw, x, y, name)

    for name, (x, y, w, h) in usecases.items():
        draw.ellipse((x, y, x + w, y + h), outline="black", width=1)
        center_text(draw, (x, y, w, h), name, SMALL)
        draw.ellipse((x + 8, y + h - 3, x + w + 8, y + h + 7), fill=(235, 235, 235), outline=None)
        draw.ellipse((x, y, x + w, y + h), outline="black", width=1)
        center_text(draw, (x, y, w, h), name, SMALL)

    def actor_center(name):
        x, y = actors[name]
        return x + 35, y + 38

    def uc_center(name):
        x, y, w, h = usecases[name]
        return x + w / 2, y + h / 2

    def uc_edge(name, toward):
        x, y, w, h = usecases[name]
        cx, cy = uc_center(name)
        return line_intersection_ellipse(cx, cy, w / 2, h / 2, *toward)

    for actor, uc in spec.get("associations", []):
        if actor not in actors or uc not in usecases:
            continue
        start = actor_center(actor)
        end = uc_edge(uc, start)
        draw.line((*start, *end), fill="black", width=1)
        arrow_head(draw, start, end, filled=False)

    for child, parent in spec.get("generalizations", []):
        if child not in actors or parent not in actors:
            continue
        start = actor_center(child)
        end = actor_center(parent)
        draw.line((*start, *end), fill="black", width=1)
        arrow_head(draw, start, end, triangle=True)

    for source, target in spec.get("includes", []):
        start_c = uc_center(source)
        end_c = uc_center(target)
        start = uc_edge(source, end_c)
        end = uc_edge(target, start_c)
        draw_dashed(draw, start, end)
        arrow_head(draw, start, end, filled=False)
        mx, my = (start[0] + end[0]) / 2, (start[1] + end[1]) / 2
        center_text(draw, (mx - 45, my - 14, 90, 18), "<<include>>", SMALL)

    for source, target in spec.get("extends", []):
        start_c = uc_center(source)
        end_c = uc_center(target)
        start = uc_edge(source, end_c)
        end = uc_edge(target, start_c)
        draw_dashed(draw, start, end)
        arrow_head(draw, start, end, filled=False)
        mx, my = (start[0] + end[0]) / 2, (start[1] + end[1]) / 2
        center_text(draw, (mx - 42, my - 14, 84, 18), "<<extend>>", SMALL)

    img.save(os.path.join(DIAGRAMS, output))


def write_mdj(spec, filename, title):
    builder = MdjBuilder(title)
    sx, sy, sw, sh = spec["subject"]
    builder.add_subject(sx, sy, sw, sh)
    for name, (x, y) in spec["actors"].items():
        builder.add_actor(name, x, y)
    for name, (x, y, w, h) in spec["usecases"].items():
        builder.add_usecase(name, x, y, w, h)
    for child, parent in spec.get("generalizations", []):
        builder.add_generalization(child, parent)
    for actor, usecase in spec.get("associations", []):
        builder.add_assoc(actor, usecase)
    for source, target in spec.get("includes", []):
        builder.add_relation(source, target, "include")
    for source, target in spec.get("extends", []):
        builder.add_relation(source, target, "extend")
    with open(os.path.join(BASE, filename), "w", encoding="utf8") as file:
        json.dump(builder.project(), file, indent="\t", ensure_ascii=False)
        file.write("\n")


def xml(value):
    return html.escape(str(value), quote=True)


def drawio_id(prefix, name):
    cleaned = "".join(ch if ch.isalnum() else "_" for ch in name)
    return f"{prefix}_{cleaned}".strip("_")


def drawio_cell(cell_id, value, style, x, y, w, h, vertex=True, parent="1"):
    vertex_attr = ' vertex="1"' if vertex else ""
    return (
        f'<mxCell id="{xml(cell_id)}" value="{xml(value)}" style="{xml(style)}"{vertex_attr} parent="{xml(parent)}">'
        f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>\n'
    )


def drawio_edge(edge_id, source, target, label="", style=None):
    if style is None:
        style = "endArrow=open;endFill=0;html=1;rounded=0;strokeColor=#000000;"
    return (
        f'<mxCell id="{xml(edge_id)}" value="{xml(label)}" style="{xml(style)}" edge="1" parent="1" '
        f'source="{xml(source)}" target="{xml(target)}"><mxGeometry relative="1" as="geometry"/></mxCell>\n'
    )


def write_drawio(spec, filename, title):
    width, height = spec.get("size", (1280, 900))
    actor_style = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;"
    usecase_style = "ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;fontSize=12;"
    subject_style = "whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;verticalAlign=top;fontSize=13;"
    assoc_style = "endArrow=open;endFill=0;html=1;rounded=0;strokeColor=#000000;fontColor=#000000;"
    include_style = "endArrow=open;endFill=0;dashed=1;html=1;rounded=0;strokeColor=#000000;fontColor=#000000;fontSize=12;labelBackgroundColor=#FFFFFF;edgeStyle=orthogonalEdgeStyle;"
    extend_style = include_style
    gen_style = "endArrow=block;endFill=0;endSize=14;html=1;rounded=0;strokeColor=#000000;fontColor=#000000;"

    cells = ['<mxCell id="0"/>\n<mxCell id="1" parent="0"/>\n']
    sx, sy, sw, sh = spec["subject"]
    cells.append(drawio_cell("system", "Plateforme GOSPORT", subject_style, sx, sy, sw, sh))

    actor_ids = {}
    for name, (x, y) in spec["actors"].items():
        cell_id = drawio_id("actor", name)
        actor_ids[name] = cell_id
        cells.append(drawio_cell(cell_id, name, actor_style, x, y, 70, 90))

    uc_ids = {}
    for name, (x, y, w, h) in spec["usecases"].items():
        cell_id = drawio_id("uc", name)
        uc_ids[name] = cell_id
        cells.append(drawio_cell(cell_id, name, usecase_style, x, y, w, h))

    edge_no = 1
    for child, parent in spec.get("generalizations", []):
        if child in actor_ids and parent in actor_ids:
            cells.append(drawio_edge(f"edge_gen_{edge_no}", actor_ids[child], actor_ids[parent], "", gen_style))
            edge_no += 1

    for actor, usecase in spec.get("associations", []):
        if actor in actor_ids and usecase in uc_ids:
            cells.append(drawio_edge(f"edge_assoc_{edge_no}", actor_ids[actor], uc_ids[usecase], "", assoc_style))
            edge_no += 1

    for source, target in spec.get("includes", []):
        if source in uc_ids and target in uc_ids:
            cells.append(drawio_edge(f"edge_include_{edge_no}", uc_ids[source], uc_ids[target], "<<include>>", include_style))
            edge_no += 1

    for source, target in spec.get("extends", []):
        if source in uc_ids and target in uc_ids:
            cells.append(drawio_edge(f"edge_extend_{edge_no}", uc_ids[source], uc_ids[target], "<<extend>>", extend_style))
            edge_no += 1

    graph = (
        f'<mxfile host="app.diagrams.net" version="21.6.8">'
        f'<diagram id="d1" name="{xml(title)}">'
        f'<mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" '
        f'arrows="1" fold="1" page="1" pageScale="1" pageWidth="{width}" pageHeight="{height}" math="0" shadow="0">'
        f'<root>{"".join(cells)}</root></mxGraphModel></diagram></mxfile>'
    )
    with open(os.path.join(BASE, filename), "w", encoding="utf8") as file:
        file.write(graph)


def presentation_only(spec):
    clean = dict(spec)
    clean["associations"] = []
    clean["generalizations"] = []
    clean["includes"] = []
    clean["extends"] = []
    return clean


AUTH_USECASE = "S'authentifier"
AUTH_SUBCASES = {
    "Verifier identifiants",
    "Verifier mot de passe",
    "Generer token JWT",
    "Generer JWT",
}


def with_authentication_includes(spec):
    if AUTH_USECASE not in spec.get("usecases", {}):
        return spec
    secured = dict(spec)
    includes = list(secured.get("includes", []))
    include_set = set(includes)
    for usecase in secured["usecases"]:
        if usecase == AUTH_USECASE or usecase in AUTH_SUBCASES:
            continue
        relation = (usecase, AUTH_USECASE)
        if relation not in include_set:
            includes.append(relation)
            include_set.add(relation)
    secured["includes"] = includes
    secured["extends"] = [
        relation for relation in secured.get("extends", []) if relation != ("Completer profil", AUTH_USECASE)
    ]
    return secured


GLOBAL = {
    "size": (1280, 900),
    "subject": (250, 40, 870, 820),
    "actors": {
        "Utilisateur": (80, 80),
        "Athlete": (80, 220),
        "Nutritionniste": (80, 360),
        "Coach": (80, 520),
        "Administrateur": (1165, 155),
        "Service IA": (1165, 520),
    },
    "usecases": {
        "S'authentifier": (320, 85, 190, 45),
        "Verifier identifiants": (740, 88, 180, 38),
        "Generer token JWT": (315, 165, 175, 38),
        "Completer profil": (690, 170, 165, 38),
        "Administrer utilisateurs": (890, 135, 210, 38),
        "Decouvrir specialistes": (330, 250, 205, 38),
        "Filtrer specialistes": (715, 250, 185, 38),
        "Gerer nutrition": (680, 315, 155, 38),
        "Executer seance": (615, 365, 170, 38),
        "Journaliser performance": (330, 385, 220, 38),
        "Gerer agenda sessions": (520, 430, 210, 38),
        "Analyser repas par IA": (835, 540, 220, 38),
        "Consulter tableaux de bord": (455, 530, 245, 38),
        "Gerer demandes de relation": (560, 610, 250, 38),
        "Notifier statut demande": (830, 670, 220, 38),
        "Gerer messagerie": (335, 730, 185, 38),
        "Gerer programmes entrainement": (620, 765, 270, 38),
    },
    "generalizations": [
        ("Athlete", "Utilisateur"),
        ("Nutritionniste", "Utilisateur"),
        ("Coach", "Utilisateur"),
        ("Administrateur", "Utilisateur"),
    ],
    "associations": [
        ("Utilisateur", "S'authentifier"),
        ("Athlete", "Decouvrir specialistes"),
        ("Athlete", "Gerer nutrition"),
        ("Athlete", "Executer seance"),
        ("Athlete", "Journaliser performance"),
        ("Athlete", "Gerer agenda sessions"),
        ("Athlete", "Gerer messagerie"),
        ("Nutritionniste", "Gerer nutrition"),
        ("Nutritionniste", "Consulter tableaux de bord"),
        ("Nutritionniste", "Gerer messagerie"),
        ("Coach", "Gerer demandes de relation"),
        ("Coach", "Gerer programmes entrainement"),
        ("Coach", "Consulter tableaux de bord"),
        ("Coach", "Gerer agenda sessions"),
        ("Coach", "Gerer messagerie"),
        ("Administrateur", "Administrer utilisateurs"),
        ("Administrateur", "Consulter tableaux de bord"),
        ("Service IA", "Analyser repas par IA"),
    ],
    "includes": [
        ("S'authentifier", "Verifier identifiants"),
        ("S'authentifier", "Generer token JWT"),
        ("Decouvrir specialistes", "Filtrer specialistes"),
        ("Gerer demandes de relation", "Notifier statut demande"),
        ("Executer seance", "Journaliser performance"),
    ],
    "extends": [
        ("Completer profil", "S'authentifier"),
        ("Analyser repas par IA", "Gerer nutrition"),
    ],
}


SPRINT1 = {
    "size": (1120, 760),
    "subject": (230, 40, 710, 650),
    "actors": {
        "Utilisateur": (70, 85),
        "Athlete": (70, 235),
        "Coach": (70, 380),
        "Nutritionniste": (70, 525),
        "Provider OAuth": (965, 185),
        "Service Email": (965, 400),
    },
    "usecases": {
        "S'inscrire": (300, 90, 155, 38),
        "Valider formulaire": (610, 90, 190, 38),
        "Envoyer code verification": (610, 170, 230, 38),
        "Verifier email": (325, 210, 170, 38),
        "S'authentifier": (330, 310, 170, 38),
        "Verifier mot de passe": (610, 300, 220, 38),
        "Generer JWT": (610, 380, 150, 38),
        "Connexion OAuth": (610, 455, 180, 38),
        "Reinitialiser mot de passe": (305, 480, 240, 38),
        "Completer onboarding": (420, 575, 225, 38),
        "Acceder espace protege": (675, 575, 220, 38),
    },
    "generalizations": [("Athlete", "Utilisateur"), ("Coach", "Utilisateur"), ("Nutritionniste", "Utilisateur")],
    "associations": [
        ("Utilisateur", "S'inscrire"),
        ("Utilisateur", "Verifier email"),
        ("Utilisateur", "S'authentifier"),
        ("Utilisateur", "Reinitialiser mot de passe"),
        ("Utilisateur", "Acceder espace protege"),
        ("Provider OAuth", "Connexion OAuth"),
        ("Service Email", "Envoyer code verification"),
        ("Service Email", "Reinitialiser mot de passe"),
    ],
    "includes": [
        ("S'inscrire", "Valider formulaire"),
        ("S'inscrire", "Envoyer code verification"),
        ("Verifier email", "Valider formulaire"),
        ("S'authentifier", "Verifier mot de passe"),
        ("S'authentifier", "Generer JWT"),
        ("Completer onboarding", "S'authentifier"),
        ("Acceder espace protege", "S'authentifier"),
        ("Reinitialiser mot de passe", "Envoyer code verification"),
    ],
    "extends": [
        ("Connexion OAuth", "S'authentifier"),
        ("Completer onboarding", "Verifier email"),
        ("Reinitialiser mot de passe", "S'authentifier"),
    ],
}


SPRINT2 = {
    "size": (1120, 760),
    "subject": (220, 40, 740, 650),
    "actors": {
        "Utilisateur": (70, 60),
        "Athlete": (70, 210),
        "Coach": (70, 380),
        "Nutritionniste": (70, 540),
        "Service Notification": (980, 390),
    },
    "usecases": {
        "S'authentifier": (300, 80, 180, 38),
        "Consulter marketplace": (300, 170, 220, 38),
        "Filtrer par specialite": (655, 170, 205, 38),
        "Envoyer demande coaching": (300, 285, 250, 38),
        "Envoyer demande nutrition": (610, 285, 250, 38),
        "Traiter demande": (320, 410, 190, 38),
        "Accepter demande": (600, 385, 190, 38),
        "Refuser demande": (600, 450, 180, 38),
        "Gerer clients": (320, 545, 170, 38),
        "Rompre relation": (610, 545, 180, 38),
        "Notifier utilisateur": (735, 625, 205, 38),
    },
    "generalizations": [("Athlete", "Utilisateur"), ("Coach", "Utilisateur"), ("Nutritionniste", "Utilisateur")],
    "associations": [
        ("Utilisateur", "S'authentifier"),
        ("Athlete", "Consulter marketplace"),
        ("Athlete", "Envoyer demande coaching"),
        ("Athlete", "Envoyer demande nutrition"),
        ("Athlete", "Rompre relation"),
        ("Coach", "Traiter demande"),
        ("Coach", "Gerer clients"),
        ("Coach", "Rompre relation"),
        ("Nutritionniste", "Traiter demande"),
        ("Nutritionniste", "Gerer clients"),
        ("Nutritionniste", "Rompre relation"),
        ("Service Notification", "Notifier utilisateur"),
    ],
    "includes": [
        ("Consulter marketplace", "S'authentifier"),
        ("Envoyer demande coaching", "S'authentifier"),
        ("Envoyer demande nutrition", "S'authentifier"),
        ("Traiter demande", "S'authentifier"),
        ("Gerer clients", "S'authentifier"),
        ("Rompre relation", "S'authentifier"),
        ("Consulter marketplace", "Filtrer par specialite"),
        ("Envoyer demande coaching", "Notifier utilisateur"),
        ("Envoyer demande nutrition", "Notifier utilisateur"),
        ("Traiter demande", "Notifier utilisateur"),
        ("Rompre relation", "Notifier utilisateur"),
    ],
    "extends": [
        ("Accepter demande", "Traiter demande"),
        ("Refuser demande", "Traiter demande"),
    ],
}


SPRINT3 = {
    "size": (1120, 800),
    "subject": (220, 40, 750, 690),
    "actors": {
        "Utilisateur": (70, 65),
        "Coach": (70, 220),
        "Athlete": (70, 420),
        "Catalogue Exercices": (965, 150),
        "Service Suivi": (965, 390),
        "Service Notification": (965, 590),
    },
    "usecases": {
        "S'authentifier": (300, 80, 180, 38),
        "Consulter catalogue exercices": (300, 165, 265, 38),
        "Rechercher exercice": (660, 165, 205, 38),
        "Creer programme": (300, 285, 190, 38),
        "Composer jour entrainement": (590, 285, 255, 38),
        "Ajouter exercice au programme": (520, 365, 290, 38),
        "Assigner programme": (300, 470, 205, 38),
        "Notifier utilisateur": (680, 470, 205, 38),
        "Accepter programme": (300, 560, 210, 38),
        "Consulter seance du jour": (585, 560, 245, 38),
        "Demarrer workout player": (300, 645, 235, 38),
        "Journaliser series": (640, 645, 200, 38),
    },
    "generalizations": [("Coach", "Utilisateur"), ("Athlete", "Utilisateur")],
    "associations": [
        ("Utilisateur", "S'authentifier"),
        ("Coach", "Consulter catalogue exercices"),
        ("Coach", "Creer programme"),
        ("Coach", "Assigner programme"),
        ("Athlete", "Consulter catalogue exercices"),
        ("Athlete", "Accepter programme"),
        ("Athlete", "Consulter seance du jour"),
        ("Athlete", "Demarrer workout player"),
        ("Athlete", "Journaliser series"),
        ("Catalogue Exercices", "Consulter catalogue exercices"),
        ("Service Suivi", "Journaliser series"),
        ("Service Notification", "Notifier utilisateur"),
    ],
    "includes": [
        ("Consulter catalogue exercices", "S'authentifier"),
        ("Creer programme", "S'authentifier"),
        ("Assigner programme", "S'authentifier"),
        ("Accepter programme", "S'authentifier"),
        ("Consulter seance du jour", "S'authentifier"),
        ("Demarrer workout player", "S'authentifier"),
        ("Journaliser series", "S'authentifier"),
        ("Consulter catalogue exercices", "Rechercher exercice"),
        ("Creer programme", "Composer jour entrainement"),
        ("Composer jour entrainement", "Ajouter exercice au programme"),
        ("Assigner programme", "Notifier utilisateur"),
        ("Demarrer workout player", "Journaliser series"),
    ],
    "extends": [
        ("Assigner programme", "Creer programme"),
        ("Accepter programme", "Assigner programme"),
        ("Demarrer workout player", "Consulter seance du jour"),
    ],
}


SPRINT4 = {
    "size": (1120, 780),
    "subject": (220, 40, 750, 675),
    "actors": {
        "Utilisateur": (70, 65),
        "Athlete": (70, 220),
        "Nutritionniste": (70, 465),
        "Service IA": (980, 240),
        "Service Analyse": (980, 500),
    },
    "usecases": {
        "S'authentifier": (300, 80, 180, 38),
        "Configurer profil alimentaire": (310, 165, 255, 38),
        "Calculer besoins nutritionnels": (650, 165, 270, 38),
        "Creer plan dietetique": (310, 285, 220, 38),
        "Composer jour alimentaire": (650, 285, 250, 38),
        "Ajouter repas": (700, 365, 170, 38),
        "Assigner plan": (335, 450, 165, 38),
        "Consulter plan actif": (640, 450, 220, 38),
        "Journaliser repas": (315, 560, 195, 38),
        "Scanner repas par IA": (620, 560, 220, 38),
        "Calculer conformite": (690, 645, 215, 38),
        "Suivre objectifs sante": (315, 645, 220, 38),
    },
    "generalizations": [("Athlete", "Utilisateur"), ("Nutritionniste", "Utilisateur")],
    "associations": [
        ("Utilisateur", "S'authentifier"),
        ("Athlete", "Configurer profil alimentaire"),
        ("Athlete", "Consulter plan actif"),
        ("Athlete", "Journaliser repas"),
        ("Athlete", "Scanner repas par IA"),
        ("Athlete", "Suivre objectifs sante"),
        ("Nutritionniste", "Configurer profil alimentaire"),
        ("Nutritionniste", "Creer plan dietetique"),
        ("Nutritionniste", "Assigner plan"),
        ("Nutritionniste", "Suivre objectifs sante"),
        ("Service IA", "Scanner repas par IA"),
        ("Service Analyse", "Calculer conformite"),
    ],
    "includes": [
        ("Configurer profil alimentaire", "S'authentifier"),
        ("Creer plan dietetique", "S'authentifier"),
        ("Assigner plan", "S'authentifier"),
        ("Consulter plan actif", "S'authentifier"),
        ("Journaliser repas", "S'authentifier"),
        ("Scanner repas par IA", "S'authentifier"),
        ("Suivre objectifs sante", "S'authentifier"),
        ("Configurer profil alimentaire", "Calculer besoins nutritionnels"),
        ("Creer plan dietetique", "Composer jour alimentaire"),
        ("Composer jour alimentaire", "Ajouter repas"),
        ("Assigner plan", "Consulter plan actif"),
        ("Journaliser repas", "Calculer conformite"),
        ("Suivre objectifs sante", "Calculer conformite"),
    ],
    "extends": [
        ("Scanner repas par IA", "Journaliser repas"),
        ("Assigner plan", "Creer plan dietetique"),
    ],
}


JOBS = [
    (GLOBAL, "global use case .mdj", "Global_Cas_Utilisation.drawio", "Global_Cas_Utilisation.png", "Diagramme de cas d'utilisation global - GOSPORT"),
    (SPRINT1, "sprint 1 use case .mdj", "Sprint1_Cas_Utilisation.drawio", "Sprint1_Cas_Utilisation.png", "Diagramme de cas d'utilisation - Sprint 1"),
    (SPRINT2, "sprint 2 use case .mdj", "Sprint2_Cas_Utilisation.drawio", "Sprint2_Cas_Utilisation.png", "Diagramme de cas d'utilisation - Sprint 2"),
    (SPRINT3, "sprint 3 use case .mdj", "Sprint3_Cas_Utilisation.drawio", "Sprint3_Cas_Utilisation.png", "Diagramme de cas d'utilisation - Sprint 3"),
    (SPRINT4, "sprint 4 use case .mdj", "Sprint4_Cas_Utilisation.drawio", "Sprint4_Cas_Utilisation.png", "Diagramme de cas d'utilisation - Sprint 4"),
]

for spec, mdj, drawio, png, title in JOBS:
    spec = with_authentication_includes(spec)
    write_mdj(spec, mdj, title)
    write_drawio(spec, drawio, title)
    render(spec, png)
    print(mdj, "->", drawio, "->", png)
