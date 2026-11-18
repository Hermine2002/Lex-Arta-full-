import type { NavGroup } from "@/lib/site-settings";

export const groups: NavGroup[] = [
  {
    label: "Legal & Regulatory",
    href: "/services/legal-regulatory/",
    links: [
      {
        label: "International Legal & FinTech Advisory",
        href: "/services/legal-regulatory/international-legal-regulatory/",
      },
      {
        label: "Commercial Contracts",
        href: "/services/legal-regulatory/commercial-contracts/",
      },
      {
        label: "Legal Opinions & Regulatory Memoranda",
        href: "/services/legal-regulatory/legal-opinions-regulatory-memoranda/",
      },
      {
        label: "Legal & Regulatory Due Diligence",
        href: "/services/legal-regulatory/legal-regulatory-due-diligence/",
      },
      {
        label: "Regulatory Perimeter Assessment",
        href: "/services/legal-regulatory/regulatory-perimeter-assessment/",
      },
      {
        label: "Payments & Financial Services Regulatory",
        href: "/services/legal-regulatory/payments-financial-services-regulatory/",
      },
      {
        label: "AI Governance",
        href: "/services/legal-regulatory/ai-governance/",
      },
    ],
  },
  {
    label: "AML/CFT & Financial Crime",
    href: "/services/aml-cft/",
    links: [
      {
        label: "Enterprise-Wide Risk Assessment",
        href: "/services/aml-cft/enterprise-wide-risk-assessment/",
      },
      {
        label: "AML Audit & Independent Review",
        href: "/services/aml-cft/aml-audit-independent-review/",
      },
      {
        label: "AML Gap Analysis",
        href: "/services/aml-cft/aml-gap-analysis/",
      },
      {
        label: "AML Remediation",
        href: "/services/aml-cft/aml-remediation/",
      },
      {
        label: "MLRO & Compliance Officer Support",
        href: "/services/aml-cft/mlro-compliance-officer-support/",
      },
      {
        label: "AML/CFT Training",
        href: "/services/aml-cft/aml-cft-training/",
      },
      {
        label: "AML Policies & Procedures",
        href: "/services/aml-cft/aml-policies-procedures/",
      },
      {
        label: "Fraud & Financial Crime Risk",
        href: "/services/aml-cft/fraud-financial-crime-risk/",
      },
    ],
  },
  {
    label: "Data Protection & Privacy",
    href: "/services/data-protection/",
    links: [
      {
        label: "Privacy Audit & Independent Review",
        href: "/services/data-protection/privacy-audit-independent-review/",
      },
      {
        label: "Privacy Impact & Risk Assessments",
        href: "/services/data-protection/privacy-impact-risk-assessments/",
      },
      {
        label: "DPO & Privacy Governance",
        href: "/services/data-protection/dpo-privacy-governance/",
      },
      {
        label: "Privacy Documentation & DPAs",
        href: "/services/data-protection/privacy-documentation-dpas/",
      },
      {
        label: "International Data Transfers",
        href: "/services/data-protection/international-data-transfers/",
      },
      {
        label: "Data Breach & Privacy Incident Response",
        href: "/services/data-protection/data-breach-incident-response/",
      },
    ],
  },
  {
    label: "Licensing",
    href: "/services/licensing/",
    links: [
      {
        label: "Licensing Strategy & Jurisdiction Assessment",
        href: "/services/licensing/licensing-strategy-jurisdiction-assessment/",
      },
      {
        label: "International Licensing & Market Entry",
        href: "/services/licensing/international/",
      },
      {
        label: "Payments & E-Money Licensing",
        href: "/services/licensing/payments-e-money/",
      },
    ],
  },
  {
    label: "Corporate & Governance",
    href: "/services/corporate-governance/",
    links: [
      {
        label: "Banking & EMI Readiness",
        href: "/services/corporate-governance/banking-emi-readiness/",
      },
      {
        label: "Post-Licensing Compliance & Regulatory Support",
        href: "/services/corporate-governance/post-licensing-compliance/",
      },
      {
        label: "Trademark & Brand Protection",
        href: "/services/corporate-governance/trademark-brand-protection/",
      },
    ],
  },
];

/** Shared site data available to both the public site and the admin. */
export const shared = { groups };
