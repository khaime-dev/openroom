// All of the demo's sample data. A made-up company, made-up people, made-up numbers.
// Dates are "days ago" so the room always looks current. Edit this file to change the story.
window.DEMO = {
  company: "Lumen Harbor",
  legal: "Lumen Harbor, Inc.",
  host: "demo.openroom",
  repo: "https://github.com/plato15/openroom",
  investorEmail: "demo-investor@example.com",
  adminEmail: "demo-admin@example.com",

  // Folders. A file is { id, name, kind, size (KB), age (days), visible, download, doc }.
  // doc: { pages: [[title, ...lines]], wide: true } for PDFs, { sheets: { Name: [[row], ...] } } for sheets.
  folders: [
    { id: "f1", name: "1. Corporate", slug: "corporate", description: "Incorporation, governance and company structure.", subs: [
      { id: "s1", name: "Certificate of incorporation", files: [
        { id: "d1", name: "Certificate of incorporation.pdf", kind: "PDF", size: 212, age: 20, visible: true, download: false, doc: { pages: [["Certificate of incorporation", "State of Delaware. Sample certificate.", "", "Name of the company: Lumen Harbor, Inc.", "Date of incorporation: 14 March 2023", "Authorised shares: 10,000,000 common, 2,000,000 preferred"]] } } ] },
      { id: "s2", name: "Bylaws", files: [
        { id: "d2", name: "Bylaws.pdf", kind: "PDF", size: 318, age: 19, visible: true, download: false, doc: { pages: [["Bylaws", "Article 1. Offices and records.", "Article 2. Meetings of stockholders.", "Article 3. Board of directors: five seats.", "Article 4. Officers."]] } } ] },
      { id: "s3", name: "Board minutes", files: [
        { id: "d3", name: "Board minutes, Q3 (draft).pdf", kind: "PDF", size: 140, age: 18, visible: false, download: false, doc: { pages: [["Board minutes, Q3", "Draft. Hidden from investors until you switch it on.", "", "1. Approval of the Q2 accounts.", "2. Hiring plan.", "3. Opening of the seed round."]] } } ] },
    ] },
    { id: "f2", name: "2. Capitalization", slug: "capitalization", description: "Who owns what.", subs: [
      { id: "s4", name: "Cap table", files: [
        { id: "d4", name: "Cap table.xlsx", kind: "XLSX", size: 24, age: 17, visible: true, download: false, doc: { sheets: { "Cap table": [["Holder", "Class", "Shares", "Ownership"], ["Founders", "Common", "6,000,000", "60%"], ["Employee option pool", "Options", "1,000,000", "10%"], ["Angel investors", "Preferred A", "1,500,000", "15%"], ["Seed fund (this round)", "Preferred B", "1,500,000", "15%"], ["Total", "", "10,000,000", "100%"]] } } } ] },
    ] },
    { id: "f3", name: "3. Financials", slug: "financials", description: "Results so far and the plan ahead.", subs: [
      { id: "s5", name: "Financial statements", files: [
        { id: "d5", name: "Financial statements 2025.pdf", kind: "PDF", size: 486, age: 16, visible: true, download: false, doc: { pages: [["Financial statements 2025", "Revenue: $1,240,000", "Cost of revenue: $410,000", "Gross profit: $830,000 (67%)", "Operating expenses: $1,050,000", "Net loss: $220,000", "", "Cash at year end: $890,000"]] } } ] },
      { id: "s6", name: "Budget and forecast", files: [
        { id: "d6", name: "Budget and forecast.xlsx", kind: "XLSX", size: 31, age: 15, visible: true, download: false, doc: { sheets: { Forecast: [["", "2026", "2027", "2028"], ["Revenue", "$2,100,000", "$3,900,000", "$6,800,000"], ["Gross margin", "68%", "70%", "72%"], ["Headcount", "14", "22", "31"], ["Operating expenses", "$2,300,000", "$3,200,000", "$4,600,000"]] } } } ] },
      { id: "s7", name: "Financial model", files: [
        { id: "d7", name: "Financial model.xlsx", kind: "XLSX", size: 58, age: 14, visible: true, download: false, doc: { sheets: { Assumptions: [["Assumption", "Value"], ["New customers per month", "12"], ["Average contract (USD a year)", "9,600"], ["Monthly churn", "1.2%"], ["Sales cycle (days)", "38"]], Summary: [["Quarter", "Customers", "ARR (USD)"], ["Q1", "118", "1,132,800"], ["Q2", "162", "1,555,200"], ["Q3", "211", "2,025,600"], ["Q4", "268", "2,572,800"]] } } } ] },
    ] },
    { id: "f4", name: "4. Team", slug: "team", description: "Management, employees and consultants.", subs: [
      { id: "s8", name: "Team biographies", files: [
        { id: "d8", name: "Team biographies.pdf", kind: "PDF", size: 260, age: 13, visible: true, download: false, doc: { pages: [["Team biographies", "Dana Whitfield, chief executive. Ten years in port logistics software.", "Marcus Oyelaran, chief technology officer. Built tracking systems at two scale-ups.", "Sofia Lindqvist, head of customers. Ran operations for a regional shipping line.", "", "Invented people, for a demo."]] } } ] },
    ] },
    { id: "f5", name: "5. Business plan", slug: "business-plan", description: "What the company does, for whom, and against whom.", subs: [
      { id: "s9", name: "Pitch deck", files: [
        { id: "d9", name: "Pitch deck.pdf", kind: "PDF", size: 1840, age: 6, visible: true, download: true, doc: { wide: true, pages: [["Lumen Harbor", "Ships wait an average of 11 hours outside busy ports.", "", "We tell every truck, crane and berth what to expect,", "so the wait shrinks and the plan holds."], ["Problem", "", "Port schedules change hourly. Each partner keeps its own spreadsheet.", "Delays ripple to roads, warehouses and customers."], ["Solution", "", "One live plan for the port, shared with everyone who touches a container.", "Customers see an estimate they can trust."], ["Traction", "", "42 ports on the platform. 118 paying customers.", "$1.24M revenue in 2025. Net revenue retention 121%."], ["The ask", "", "$3M seed round to open two new regions", "and double the product team."]] } } ] },
      { id: "s10", name: "Executive summary", files: [
        { id: "d10", name: "Executive summary.pdf", kind: "PDF", size: 190, age: 6, visible: true, download: true, doc: { pages: [["Executive summary", "Lumen Harbor sells live port scheduling software to shipping lines", "and terminal operators.", "", "Founded 2023. 14 people. Offices in Rotterdam and Lagos.", "Raising a $3M seed round at a $12M pre-money valuation."]] } } ] },
      { id: "s11", name: "Key metrics", files: [
        { id: "d11", name: "Key metrics.xlsx", kind: "XLSX", size: 19, age: 5, visible: true, download: false, doc: { sheets: { Metrics: [["Metric", "Q1", "Q2", "Q3", "Q4"], ["Customers", "118", "162", "211", "268"], ["ARR (USD)", "1,132,800", "1,555,200", "2,025,600", "2,572,800"], ["Net revenue retention", "112%", "115%", "119%", "121%"], ["Monthly churn", "1.5%", "1.4%", "1.3%", "1.2%"]] } } } ] },
    ] },
    { id: "f6", name: "6. Financing", slug: "financing", description: "This round's terms and the investors so far.", subs: [
      { id: "s12", name: "Term sheet", files: [
        { id: "d12", name: "Term sheet.pdf", kind: "PDF", size: 175, age: 4, visible: true, download: false, doc: { pages: [["Summary of terms", "Round: seed.  Amount: $3,000,000.", "Pre-money valuation: $12,000,000.", "Instrument: Series Seed preferred stock, 1x non-participating.", "Board: five seats, one for the lead investor.", "", "Sample terms for a demo. Not an offer."]] } } ] },
      { id: "s13", name: "Use of funds", files: [
        { id: "d13", name: "Use of funds.pdf", kind: "PDF", size: 96, age: 4, visible: true, download: false, doc: { pages: [["Use of funds", "Product and engineering: 45%", "Sales and customer success: 30%", "New regions: 15%", "General and administrative: 10%"]] } } ] },
      { id: "s14", name: "Disclosure schedule", files: [
        { id: "d14", name: "Disclosure schedule.pdf", kind: "PDF", size: 88, age: 3, visible: false, download: false, doc: { pages: [["Disclosure schedule", "Draft. Still being prepared with counsel."]] } } ] },
    ] },
    { id: "f7", name: "7. IP", slug: "ip-rights", description: "Intellectual property and agreements that touch it.", subs: [
      { id: "s15", name: "Patents and trademarks", files: [
        { id: "d15", name: "Patents and trademarks.pdf", kind: "PDF", size: 120, age: 12, visible: true, download: false, doc: { pages: [["Patents and trademarks", "Trademark: Lumen Harbor, class 9 and 42. Filed 2023.", "Patent application: dynamic berth scheduling method. Pending."]] } } ] },
    ] },
  ],

  // Investors. folders = top-level folder ids they can open. ago = days since last seen.
  investors: [
    { id: "i0", name: "Demo Investor", firm: "Sample Capital", email: "demo-investor@example.com", folders: ["f1", "f2", "f3", "f5", "f6"], ago: 0, ends: null, revoked: false },
    { id: "i1", name: "Priya Raman", firm: "Orchard Ventures", email: "priya.raman@example.com", folders: ["f1", "f2", "f3", "f4", "f5", "f6"], ago: 2, ends: null, revoked: false },
    { id: "i2", name: "Tom Becker", firm: "Granite Partners", email: "tom.becker@example.com", folders: ["f1", "f2", "f3", "f5"], ago: 5, ends: null, revoked: false },
    { id: "i3", name: "Ana Souza", firm: "Meridian Angels", email: "ana.souza@example.com", folders: ["f5", "f6"], ago: 9, ends: null, revoked: false },
    { id: "i4", name: "Kofi Mensah", firm: "Harbor Fund", email: "kofi.mensah@example.com", folders: ["f1", "f3"], ago: 14, ends: -3, revoked: false },
  ],

  requests: [
    { id: "r1", name: "Maya Okafor", firm: "Lakeside Partners", email: "maya.okafor@example.com", note: "Introduced by Priya at Orchard Ventures. We would like to look at the round.", hoursAgo: 6 },
  ],

  // Past activity: [investor id, file id, hours ago, country]. Sign-ins are added for the first of each day.
  activity: [
    ["i1", "d9", 3, "GB"], ["i2", "d4", 12, "US"], ["i1", "d12", 20, "GB"], ["i3", "d10", 31, "NG"], ["i2", "d5", 44, "US"], ["i1", "d4", 52, "GB"],
    ["i3", "d9", 70, "NG"], ["i2", "d11", 76, "US"], ["i1", "d7", 95, "GB"], ["i4", "d5", 120, "DE"], ["i2", "d1", 130, "US"], ["i1", "d8", 150, "GB"],
    ["i3", "d13", 170, "NG"], ["i4", "d1", 200, "DE"], ["i1", "d9", 240, "GB"], ["i2", "d6", 260, "US"],
  ],

  // Templates for the "Start from a template" page: adding one creates folders with placeholders to replace.
  templates: [
    { id: "investor", name: "Investor data room", summary: "For a fundraise: the standard due diligence checklist, section by section, with short links like /cap-table.", sections: [["Corporate", ["Certificate of incorporation", "Bylaws", "Board minutes"]], ["Capitalization", ["Cap table", "Option plan"]], ["Financials", ["Financial statements", "Budget and forecast"]]] },
    { id: "sale", name: "Selling the company", summary: "For a sale or merger: what a buyer reviews before signing.", sections: [["Corporate", ["Group structure chart", "Constitutional documents"]], ["Financial", ["Audited accounts", "Management accounts"]], ["Tax", ["Tax returns"]]] },
    { id: "client", name: "Client project room", summary: "For sharing proposals, contracts and deliverables with a client.", sections: [["Proposals", ["Proposal", "Pricing"]], ["Contracts", ["Agreement"]], ["Deliverables", ["Current deliverables"]]] },
  ],
};
