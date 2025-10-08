/**
 * SEO utility functions for dynamic meta tag updates
 */

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
}

/**
 * Update document meta tags dynamically
 */
export function updateSEO(data: SEOData) {
  // Update title
  if (data.title) {
    document.title = data.title;
  }

  // Update meta description
  if (data.description) {
    updateMetaTag("name", "description", data.description);
  }

  // Update keywords
  if (data.keywords) {
    updateMetaTag("name", "keywords", data.keywords);
  }

  // Update Open Graph tags
  if (data.ogTitle) {
    updateMetaTag("property", "og:title", data.ogTitle);
  }
  if (data.ogDescription) {
    updateMetaTag("property", "og:description", data.ogDescription);
  }

  // Update Twitter tags
  if (data.twitterTitle) {
    updateMetaTag("property", "twitter:title", data.twitterTitle);
  }
  if (data.twitterDescription) {
    updateMetaTag("property", "twitter:description", data.twitterDescription);
  }
}

/**
 * Helper function to update or create meta tags
 */
function updateMetaTag(attribute: string, value: string, content: string) {
  let tag = document.querySelector(`meta[${attribute}="${value}"]`);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, value);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
}

/**
 * Generate SEO data based on diagram type and content
 */
export function generateDiagramSEO(diagramType: string): SEOData {
  const baseTitle = "Mermaid Diagram Editor Online";
  const baseSuffix = "Free Flowchart & Sequence Diagram Maker";

  const diagramTitles: Record<string, string> = {
    flowchart: "Flowchart Maker",
    sequence: "Sequence Diagram Generator",
    class: "Class Diagram Creator",
    gantt: "Gantt Chart Maker",
    pie: "Pie Chart Generator",
    journey: "User Journey Map Creator",
    kanban: "Kanban Board Maker",
    architecture: "Architecture Diagram Tool",
    treemap: "Treemap Diagram Creator",
    state: "State Diagram Generator",
    er: "ER Diagram Creator",
    mindmap: "Mindmap Creator",
    timeline: "Timeline Chart Maker",
    quadrant: "Quadrant Chart Generator",
    git: "Git Graph Visualizer",
  };

  const diagramDescriptions: Record<string, string> = {
    flowchart:
      "Create professional flowcharts online with our free Mermaid diagram editor. Live preview, export to SVG/PNG, and shareable URLs.",
    sequence:
      "Generate sequence diagrams easily with Mermaid syntax. Perfect for documenting API interactions and system communications.",
    class:
      "Design UML class diagrams with relationships and inheritance. Ideal for software architecture documentation.",
    gantt:
      "Build project timelines and Gantt charts with dates, dependencies, and milestones. Perfect for project management.",
    pie: "Create data visualization pie charts with custom labels and values. Great for presentations and reports.",
    journey:
      "Map user journeys and customer experiences with emotional scoring and touchpoints.",
    kanban:
      "Visualize workflow with Kanban boards showing todo, in-progress, and done columns with assignments.",
    architecture:
      "Design system architecture diagrams with services, databases, and connections.",
    treemap:
      "Create hierarchical treemap visualizations for data representation and analysis.",
    state:
      "Model state machines and transitions for system behavior documentation.",
    er: "Design entity-relationship diagrams for database schema and data modeling.",
    mindmap:
      "Create mind maps for brainstorming, planning, and knowledge organization.",
    timeline:
      "Build timeline charts for project milestones, historical events, and schedules.",
    quadrant:
      "Generate quadrant charts for priority matrices and strategic planning.",
    git: "Visualize Git branching strategies and repository workflows.",
  };

  const specificTitle = diagramTitles[diagramType];
  const specificDescription = diagramDescriptions[diagramType];

  return {
    title: specificTitle
      ? `${specificTitle} - ${baseTitle}`
      : `${baseTitle} - ${baseSuffix}`,
    description:
      specificDescription ||
      `Create beautiful Mermaid diagrams online with live preview. Free flowchart maker, sequence diagrams, class diagrams, Gantt charts, and more. Export as SVG/PNG with shareable URLs.`,
    keywords: `mermaid diagram editor, ${diagramType} maker online, ${diagramType} generator, diagram editor online, mermaid js playground, free diagram tool`,
    ogTitle: specificTitle
      ? `${specificTitle} - ${baseTitle}`
      : `${baseTitle} - ${baseSuffix}`,
    ogDescription:
      specificDescription ||
      `Create beautiful Mermaid diagrams online with live preview. Free flowchart maker, sequence diagrams, class diagrams, Gantt charts, and more.`,
    twitterTitle: specificTitle
      ? `${specificTitle} - ${baseTitle}`
      : `${baseTitle} - ${baseSuffix}`,
    twitterDescription:
      specificDescription ||
      `Create beautiful Mermaid diagrams online with live preview. Free flowchart maker, sequence diagrams, class diagrams, Gantt charts, and more.`,
  };
}
