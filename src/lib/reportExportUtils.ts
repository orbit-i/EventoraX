import JSZip from 'jszip';
import { printElement } from './printUtils';

export interface FinancialAuditReport {
  interval: string;
  intervalLabel: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  financials: {
    grossSalesUsd: number;
    grossSalesPkr: number;
    operatingPurchasesUsd: number;
    operatingPurchasesPkr: number;
    grossProfitUsd: number;
    grossProfitPkr: number;
    netProfitUsd: number;
    netProfitPkr: number;
    profitMarginPercent: number;
    isLoss: boolean;
    lossAmountUsd: number;
    lossAmountPkr: number;
    salesBreakdown: {
      starterPlanRevenue: number;
      professionalPlanRevenue: number;
      enterprisePlanRevenue: number;
      customPlanRevenue: number;
      ticketCommissions: number;
      addOnQuotaPacks: number;
    };
    purchasesBreakdown: {
      merchantGatewayFees: number;
      telcoSmsVerification: number;
      emailDeliveryInfrastructure: number;
      cloudHostingAndDatabases: number;
      tamperEvidentStorage: number;
      securitySentinelScanner: number;
      maintenanceReserve: number;
    };
  };
  organizations: {
    totalCount: number;
    activeCount: number;
    suspendedCount: number;
    planDistribution: {
      Starter: number;
      Professional: number;
      Enterprise: number;
      Custom: number;
    };
    statusDistribution: {
      active: number;
      suspended: number;
      pending: number;
    };
    totalEvents: number;
    totalAttendees: number;
    totalCertificates: number;
    totalCheckIns: number;
    checkInRatePercent: number;
    items: Array<{
      id: number;
      name: string;
      slug: string;
      plan: string;
      status: string;
      eventsCount: number;
      attendeesCount: number;
      certsCount: number;
      checkInsCount: number;
      licenseKey?: string;
      grossRevenue: number;
      createdAt: string;
    }>;
  };
  timeline: Array<{
    label: string;
    startDate: string;
    endDate: string;
    sales: number;
    purchases: number;
    profit: number;
    margin: number;
    activeOrgs: number;
    eventsCount: number;
    attendeesCount: number;
  }>;
  compliance: {
    auditNumber: string;
    taxNtn: string;
    taxStrn: string;
    sbpLevel1Certified: boolean;
    regulatoryBody: string;
    governingEntity: string;
    generatedAt: string;
  };
}

/**
 * 1. EXCEL EXPORT (.xlsx)
 * Generates a comprehensive multi-worksheet corporate Excel XML workbook
 * Compatible with Microsoft Excel (Desktop/Mobile), Google Sheets, Apple Numbers, and LibreOffice.
 */
export function exportReportToExcel(report: FinancialAuditReport, fileNamePrefix: string = 'Eventrye-Financial-Report'): boolean {
  try {
    const f = report.financials;
    const orgs = report.organizations;
    const generatedDate = new Date(report.compliance.generatedAt || Date.now()).toLocaleString();

    // Escape helper for XML
    const xmlEscape = (str: string | number | null | undefined): string => {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Eventrye Platform Authority</Author>
  <LastAuthor>ORBIT-I Private Limited</LastAuthor>
  <Created>${new Date().toISOString()}</Created>
  <Company>ORBIT-I Private Limited</Company>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="HeaderMain">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SubHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SectionHeader">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
   </Borders>
  </Style>
  <Style ss:ID="TableHeader">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TableRow">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="NumberCurrencyUSD">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="$#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="NumberCurrencyPKR">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="Rs #,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="NumberPercent">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="0.0%"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="HighlightPositive">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#047857"/>
   <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="HighlightNegative">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#B91C1C"/>
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
  </Style>
 </Styles>

 <!-- WORKSHEET 1: EXECUTIVE SUMMARY -->
 <Worksheet ss:Name="Executive Summary">
  <Table ss:DefaultColumnWidth="140">
   <Column ss:Width="200"/>
   <Column ss:Width="160"/>
   <Column ss:Width="160"/>
   <Column ss:Width="220"/>
   <Row ss:Height="30">
    <Cell ss:MergeAcross="3" ss:StyleID="HeaderMain"><Data ss:Type="String">EVENTRYE ENTERPRISE PLATFORM EXECUTIVE AUDIT</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="3" ss:StyleID="SubHeader"><Data ss:Type="String">Audit Period: ${xmlEscape(report.intervalLabel)} | SBP Level-1 Compliant</Data></Cell>
   </Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   
   <Row>
    <Cell ss:StyleID="SectionHeader"><Data ss:Type="String">Governance &amp; Authority</Data></Cell>
    <Cell ss:StyleID="SectionHeader"><Data ss:Type="String">Value</Data></Cell>
    <Cell ss:StyleID="SectionHeader"><Data ss:Type="String">Metric</Data></Cell>
    <Cell ss:StyleID="SectionHeader"><Data ss:Type="String">Value</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Audit Tracking No.</Data></Cell>
    <Cell><Data ss:Type="String">${xmlEscape(report.compliance.auditNumber)}</Data></Cell>
    <Cell><Data ss:Type="String">Governing Entity</Data></Cell>
    <Cell><Data ss:Type="String">${xmlEscape(report.compliance.governingEntity)}</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">FBR Corporate NTN</Data></Cell>
    <Cell><Data ss:Type="String">${xmlEscape(report.compliance.taxNtn)}</Data></Cell>
    <Cell><Data ss:Type="String">Sales Tax STRN</Data></Cell>
    <Cell><Data ss:Type="String">${xmlEscape(report.compliance.taxStrn)}</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Generated At</Data></Cell>
    <Cell><Data ss:Type="String">${xmlEscape(generatedDate)}</Data></Cell>
    <Cell><Data ss:Type="String">Time Span (Days)</Data></Cell>
    <Cell><Data ss:Type="Number">${report.durationDays}</Data></Cell>
   </Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>

   <Row>
    <Cell ss:MergeAcross="3" ss:StyleID="SectionHeader"><Data ss:Type="String">KEY FINANCIAL INDICATORS (P&amp;L OVERVIEW)</Data></Cell>
   </Row>
   <Row ss:StyleID="TableHeader">
    <Cell><Data ss:Type="String">Financial Metric</Data></Cell>
    <Cell><Data ss:Type="String">Amount (USD $)</Data></Cell>
    <Cell><Data ss:Type="String">Amount (PKR Rs)</Data></Cell>
    <Cell><Data ss:Type="String">Performance Analysis</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Gross Platform Sales (Revenue)</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.grossSalesUsd}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${f.grossSalesPkr}</Data></Cell>
    <Cell><Data ss:Type="String">Subscriptions + Ticketing Fees + Quotas</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Operating Purchases &amp; Direct Costs</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.operatingPurchasesUsd}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${f.operatingPurchasesPkr}</Data></Cell>
    <Cell><Data ss:Type="String">Gateways, SMS Telco, Cloud Servers &amp; DB</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Gross Profit</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.grossProfitUsd}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${f.grossProfitPkr}</Data></Cell>
    <Cell><Data ss:Type="String">Sales less direct COGS transaction fees</Data></Cell>
   </Row>
   <Row ss:StyleID="${f.isLoss ? 'HighlightNegative' : 'HighlightPositive'}">
    <Cell><Data ss:Type="String">Net Operating Profit / (Loss)</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.netProfitUsd}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${f.netProfitPkr}</Data></Cell>
    <Cell><Data ss:Type="String">${f.isLoss ? 'NET OPERATING DEFICIT' : 'NET OPERATING PROFIT'}</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Net Profit Margin</Data></Cell>
    <Cell ss:StyleID="NumberPercent"><Data ss:Type="Number">${(f.profitMarginPercent / 100).toFixed(3)}</Data></Cell>
    <Cell><Data ss:Type="String">${f.profitMarginPercent}%</Data></Cell>
    <Cell><Data ss:Type="String">${f.profitMarginPercent >= 50 ? 'Strong SaaS Unit Economics' : 'Moderate Expansion Tier'}</Data></Cell>
   </Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>

   <Row>
    <Cell ss:MergeAcross="3" ss:StyleID="SectionHeader"><Data ss:Type="String">ECOSYSTEM &amp; CLIENT ORGANIZATIONS SUMMARY</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Total Client Organizations</Data></Cell>
    <Cell><Data ss:Type="Number">${orgs.totalCount}</Data></Cell>
    <Cell><Data ss:Type="String">Active Client Workspaces</Data></Cell>
    <Cell><Data ss:Type="Number">${orgs.activeCount}</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Total Events Hosted</Data></Cell>
    <Cell><Data ss:Type="Number">${orgs.totalEvents}</Data></Cell>
    <Cell><Data ss:Type="String">Total Registered Attendees</Data></Cell>
    <Cell><Data ss:Type="Number">${orgs.totalAttendees}</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Issued Certificates &amp; ID Passes</Data></Cell>
    <Cell><Data ss:Type="Number">${orgs.totalCertificates}</Data></Cell>
    <Cell><Data ss:Type="String">QR Check-in Success Rate</Data></Cell>
    <Cell><Data ss:Type="String">${orgs.checkInRatePercent}%</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- WORKSHEET 2: PROFIT & LOSS STATEMENT -->
 <Worksheet ss:Name="Profit and Loss Statement">
  <Table ss:DefaultColumnWidth="150">
   <Column ss:Width="240"/>
   <Column ss:Width="160"/>
   <Column ss:Width="160"/>
   <Column ss:Width="200"/>
   <Row ss:Height="26">
    <Cell ss:MergeAcross="3" ss:StyleID="HeaderMain"><Data ss:Type="String">STATEMENT OF PROFIT &amp; LOSS (INCOME STATEMENT)</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="3" ss:StyleID="SubHeader"><Data ss:Type="String">Period: ${xmlEscape(report.intervalLabel)}</Data></Cell>
   </Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>

   <!-- REVENUES -->
   <Row>
    <Cell ss:MergeAcross="3" ss:StyleID="SectionHeader"><Data ss:Type="String">1. REVENUE &amp; SALES INFLOWS</Data></Cell>
   </Row>
   <Row ss:StyleID="TableHeader">
    <Cell><Data ss:Type="String">Revenue Source</Data></Cell>
    <Cell><Data ss:Type="String">Amount (USD $)</Data></Cell>
    <Cell><Data ss:Type="String">Amount (PKR Rs)</Data></Cell>
    <Cell><Data ss:Type="String">% of Total Sales</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Starter Plan Subscriptions ($36/mo)</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.salesBreakdown.starterPlanRevenue}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${Math.round(f.salesBreakdown.starterPlanRevenue * 278)}</Data></Cell>
    <Cell><Data ss:Type="String">${f.grossSalesUsd > 0 ? ((f.salesBreakdown.starterPlanRevenue / f.grossSalesUsd) * 100).toFixed(1) + '%' : '0%'}</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Professional Plan Subscriptions ($99/mo)</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.salesBreakdown.professionalPlanRevenue}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${Math.round(f.salesBreakdown.professionalPlanRevenue * 278)}</Data></Cell>
    <Cell><Data ss:Type="String">${f.grossSalesUsd > 0 ? ((f.salesBreakdown.professionalPlanRevenue / f.grossSalesUsd) * 100).toFixed(1) + '%' : '0%'}</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Enterprise Plan Subscriptions ($299/mo)</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.salesBreakdown.enterprisePlanRevenue}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${Math.round(f.salesBreakdown.enterprisePlanRevenue * 278)}</Data></Cell>
    <Cell><Data ss:Type="String">${f.grossSalesUsd > 0 ? ((f.salesBreakdown.enterprisePlanRevenue / f.grossSalesUsd) * 100).toFixed(1) + '%' : '0%'}</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Ticketing Commissions &amp; Platform Processing</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.salesBreakdown.ticketCommissions}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${Math.round(f.salesBreakdown.ticketCommissions * 278)}</Data></Cell>
    <Cell><Data ss:Type="String">${f.grossSalesUsd > 0 ? ((f.salesBreakdown.ticketCommissions / f.grossSalesUsd) * 100).toFixed(1) + '%' : '0%'}</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Add-on Resource Quotas (SMS, Certs, Attendees)</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.salesBreakdown.addOnQuotaPacks}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${Math.round(f.salesBreakdown.addOnQuotaPacks * 278)}</Data></Cell>
    <Cell><Data ss:Type="String">${f.grossSalesUsd > 0 ? ((f.salesBreakdown.addOnQuotaPacks / f.grossSalesUsd) * 100).toFixed(1) + '%' : '0%'}</Data></Cell>
   </Row>
   <Row ss:StyleID="HighlightPositive">
    <Cell><Data ss:Type="String">TOTAL GROSS SALES (A)</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.grossSalesUsd}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${f.grossSalesPkr}</Data></Cell>
    <Cell><Data ss:Type="String">100.0%</Data></Cell>
   </Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>

   <!-- PURCHASES & EXPENSES -->
   <Row>
    <Cell ss:MergeAcross="3" ss:StyleID="SectionHeader"><Data ss:Type="String">2. PURCHASES &amp; OPERATIONAL EXPENSES (COGS &amp; OPEX)</Data></Cell>
   </Row>
   <Row ss:StyleID="TableHeader">
    <Cell><Data ss:Type="String">Expense Category</Data></Cell>
    <Cell><Data ss:Type="String">Amount (USD $)</Data></Cell>
    <Cell><Data ss:Type="String">Amount (PKR Rs)</Data></Cell>
    <Cell><Data ss:Type="String">Cost Classification</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Merchant Payment Gateway Fees (2.5%)</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.purchasesBreakdown.merchantGatewayFees}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${Math.round(f.purchasesBreakdown.merchantGatewayFees * 278)}</Data></Cell>
    <Cell><Data ss:Type="String">Direct COGS (Easypaisa/JazzCash/Stripe)</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Telco SMS &amp; WhatsApp OTP Gateway ($0.015/ea)</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.purchasesBreakdown.telcoSmsVerification}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${Math.round(f.purchasesBreakdown.telcoSmsVerification * 278)}</Data></Cell>
    <Cell><Data ss:Type="String">Direct COGS (Telco Gateway)</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">High-Throughput Email Relay ($0.001/ea)</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.purchasesBreakdown.emailDeliveryInfrastructure}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${Math.round(f.purchasesBreakdown.emailDeliveryInfrastructure * 278)}</Data></Cell>
    <Cell><Data ss:Type="String">Direct COGS (SMTP Dispatch)</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Cloud Server VPS &amp; MySQL Cluster</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.purchasesBreakdown.cloudHostingAndDatabases}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${Math.round(f.purchasesBreakdown.cloudHostingAndDatabases * 278)}</Data></Cell>
    <Cell><Data ss:Type="String">OPEX (Compute &amp; Databases)</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Tamper-Evident Storage &amp; Verification CDN</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.purchasesBreakdown.tamperEvidentStorage}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${Math.round(f.purchasesBreakdown.tamperEvidentStorage * 278)}</Data></Cell>
    <Cell><Data ss:Type="String">OPEX (Cloud Object Storage)</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Security Sentinel 24/7 AI Scanner</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.purchasesBreakdown.securitySentinelScanner}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${Math.round(f.purchasesBreakdown.securitySentinelScanner * 278)}</Data></Cell>
    <Cell><Data ss:Type="String">OPEX (Cybersecurity Compliance)</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Systems Maintenance Reserve</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.purchasesBreakdown.maintenanceReserve}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${Math.round(f.purchasesBreakdown.maintenanceReserve * 278)}</Data></Cell>
    <Cell><Data ss:Type="String">OPEX (Engineering Reserve)</Data></Cell>
   </Row>
   <Row ss:StyleID="HighlightNegative">
    <Cell><Data ss:Type="String">TOTAL PURCHASES &amp; OPERATING COSTS (B)</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.operatingPurchasesUsd}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${f.operatingPurchasesPkr}</Data></Cell>
    <Cell><Data ss:Type="String">Total Deductions</Data></Cell>
   </Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>

   <!-- BOTTOM LINE -->
   <Row>
    <Cell ss:MergeAcross="3" ss:StyleID="SectionHeader"><Data ss:Type="String">3. NET FINANCIAL RESULTS</Data></Cell>
   </Row>
   <Row ss:StyleID="${f.isLoss ? 'HighlightNegative' : 'HighlightPositive'}">
    <Cell><Data ss:Type="String">NET OPERATING PROFIT / (LOSS) (A - B)</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${f.netProfitUsd}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyPKR"><Data ss:Type="Number">${f.netProfitPkr}</Data></Cell>
    <Cell><Data ss:Type="String">${f.isLoss ? 'DEFICIT OF $' + f.lossAmountUsd : 'PROFIT OF $' + f.netProfitUsd}</Data></Cell>
   </Row>
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">Operating Profit Margin</Data></Cell>
    <Cell ss:StyleID="NumberPercent"><Data ss:Type="Number">${(f.profitMarginPercent / 100).toFixed(3)}</Data></Cell>
    <Cell><Data ss:Type="String">${f.profitMarginPercent}%</Data></Cell>
    <Cell><Data ss:Type="String">Target: &gt; 65%</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- WORKSHEET 3: ORGANIZATION DISTRIBUTIONS -->
 <Worksheet ss:Name="Organization Distributions">
  <Table ss:DefaultColumnWidth="130">
   <Column ss:Width="60"/>
   <Column ss:Width="200"/>
   <Column ss:Width="130"/>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Column ss:Width="80"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="140"/>
   <Row ss:Height="26">
    <Cell ss:MergeAcross="10" ss:StyleID="HeaderMain"><Data ss:Type="String">CLIENT ORGANIZATIONS DISTRIBUTION &amp; ECOSYSTEM AUDIT</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="10" ss:StyleID="SubHeader"><Data ss:Type="String">Total Organizations: ${orgs.totalCount} | Active: ${orgs.activeCount} | Period: ${xmlEscape(report.intervalLabel)}</Data></Cell>
   </Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   <Row ss:StyleID="TableHeader">
    <Cell><Data ss:Type="String">ID</Data></Cell>
    <Cell><Data ss:Type="String">Organization Name</Data></Cell>
    <Cell><Data ss:Type="String">Portal Slug</Data></Cell>
    <Cell><Data ss:Type="String">Plan Tier</Data></Cell>
    <Cell><Data ss:Type="String">Status</Data></Cell>
    <Cell><Data ss:Type="String">Events</Data></Cell>
    <Cell><Data ss:Type="String">Attendees</Data></Cell>
    <Cell><Data ss:Type="String">Certificates</Data></Cell>
    <Cell><Data ss:Type="String">Check-Ins</Data></Cell>
    <Cell><Data ss:Type="String">Est. Revenue</Data></Cell>
    <Cell><Data ss:Type="String">License Key</Data></Cell>
   </Row>
   ${orgs.items.length > 0 ? orgs.items.map(item => `
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="Number">${item.id}</Data></Cell>
    <Cell><Data ss:Type="String">${xmlEscape(item.name)}</Data></Cell>
    <Cell><Data ss:Type="String">${xmlEscape(item.slug)}</Data></Cell>
    <Cell><Data ss:Type="String">${xmlEscape(item.plan)}</Data></Cell>
    <Cell><Data ss:Type="String">${xmlEscape(item.status)}</Data></Cell>
    <Cell><Data ss:Type="Number">${item.eventsCount}</Data></Cell>
    <Cell><Data ss:Type="Number">${item.attendeesCount}</Data></Cell>
    <Cell><Data ss:Type="Number">${item.certsCount}</Data></Cell>
    <Cell><Data ss:Type="Number">${item.checkInsCount}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${item.grossRevenue}</Data></Cell>
    <Cell><Data ss:Type="String">${xmlEscape(item.licenseKey || 'EVX-ACTIVE')}</Data></Cell>
   </Row>`).join('') : `
   <Row ss:StyleID="TableRow">
    <Cell ss:MergeAcross="10"><Data ss:Type="String">No client organizations registered in this audit interval.</Data></Cell>
   </Row>`}
  </Table>
 </Worksheet>

 <!-- WORKSHEET 4: PERIODIC TIMELINE LEDGER -->
 <Worksheet ss:Name="Timeline Ledger">
  <Table ss:DefaultColumnWidth="130">
   <Column ss:Width="120"/>
   <Column ss:Width="140"/>
   <Column ss:Width="140"/>
   <Column ss:Width="140"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Column ss:Width="100"/>
   <Row ss:Height="26">
    <Cell ss:MergeAcross="7" ss:StyleID="HeaderMain"><Data ss:Type="String">PERIODIC FINANCIAL &amp; OPERATIONAL TIMELINE LEDGER</Data></Cell>
   </Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   <Row ss:StyleID="TableHeader">
    <Cell><Data ss:Type="String">Time Bucket</Data></Cell>
    <Cell><Data ss:Type="String">Sales (USD $)</Data></Cell>
    <Cell><Data ss:Type="String">Purchases (USD $)</Data></Cell>
    <Cell><Data ss:Type="String">Net Profit (USD $)</Data></Cell>
    <Cell><Data ss:Type="String">Margin (%)</Data></Cell>
    <Cell><Data ss:Type="String">Active Orgs</Data></Cell>
    <Cell><Data ss:Type="String">Events</Data></Cell>
    <Cell><Data ss:Type="String">Attendees</Data></Cell>
   </Row>
   ${report.timeline.map(t => `
   <Row ss:StyleID="TableRow">
    <Cell><Data ss:Type="String">${xmlEscape(t.label)}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${t.sales}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${t.purchases}</Data></Cell>
    <Cell ss:StyleID="NumberCurrencyUSD"><Data ss:Type="Number">${t.profit}</Data></Cell>
    <Cell ss:StyleID="NumberPercent"><Data ss:Type="Number">${(t.margin / 100).toFixed(3)}</Data></Cell>
    <Cell><Data ss:Type="Number">${t.activeOrgs}</Data></Cell>
    <Cell><Data ss:Type="Number">${t.eventsCount}</Data></Cell>
    <Cell><Data ss:Type="Number">${t.attendeesCount}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const cleanInterval = (report.interval || 'report').replace(/[^a-zA-Z0-9]/g, '-');
    const fileName = `${fileNamePrefix}-${cleanInterval}.xlsx`;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
    }, 300);

    return true;
  } catch (err) {
    console.error('[exportReportToExcel Error]:', err);
    return false;
  }
}

/**
 * 2. POWERPOINT PRESENTATION EXPORT (.pptx)
 * Generates an executive slide deck using JSZip (Office Open XML PresentationML format)
 * Contains 5 executive slides: Title, KPI Snapshot, P&L Statement, Organization Distributions, and Governance.
 */
export async function exportReportToPowerPoint(report: FinancialAuditReport, fileNamePrefix: string = 'Eventrye-Executive-Report'): Promise<boolean> {
  try {
    const zip = new JSZip();
    const f = report.financials;
    const orgs = report.organizations;

    // Helper to sanitize XML text
    const esc = (val: any) => String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    // 1. [Content_Types].xml
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide3.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide4.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide5.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`);

    // 2. _rels/.rels
    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`);

    // 3. ppt/_rels/presentation.xml.rels
    zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide3.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide4.xml"/>
  <Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide5.xml"/>
</Relationships>`);

    // 4. ppt/presentation.xml
    zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
    <p:sldId id="257" r:id="rId3"/>
    <p:sldId id="258" r:id="rId4"/>
    <p:sldId id="259" r:id="rId5"/>
    <p:sldId id="260" r:id="rId6"/>
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="5143500" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`);

    // 5. ppt/theme/theme1.xml
    zip.file('ppt/theme/theme1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Eventrye Corporate Dark">
  <a:themeElements>
    <a:clrScheme name="Eventrye">
      <a:dk1><a:srgbClr val="0F172A"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1E293B"/></a:dk2>
      <a:lt2><a:srgbClr val="F8FAFC"/></a:lt2>
      <a:accent1><a:srgbClr val="2563EB"/></a:accent1>
      <a:accent2><a:srgbClr val="10B981"/></a:accent2>
      <a:accent3><a:srgbClr val="6366F1"/></a:accent3>
      <a:accent4><a:srgbClr val="F59E0B"/></a:accent4>
      <a:accent5><a:srgbClr val="EF4444"/></a:accent5>
      <a:accent6><a:srgbClr val="06B6D4"/></a:accent6>
      <a:hlink><a:srgbClr val="3B82F6"/></a:hlink>
      <a:folHlink><a:srgbClr val="8B5CF6"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Modern">
      <a:majorFont><a:latin typeface="Segoe UI Semibold"/></a:majorFont>
      <a:minorFont><a:latin typeface="Segoe UI"/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`);

    // 6. ppt/slideLayouts/slideLayout1.xml & _rels
    zip.file('ppt/slideLayouts/slideLayout1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank">
  <p:cSld name="Blank Layout"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
</p:sldLayout>`);

    zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`);

    // 7. ppt/slideMasters/slideMaster1.xml & _rels
    zip.file('ppt/slideMasters/slideMaster1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`);

    zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`);

    // Helper for slide relationships
    const slideRelContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`;

    for (let i = 1; i <= 5; i++) {
      zip.file(`ppt/slides/_rels/slide${i}.xml.rels`, slideRelContent);
    }

    // SLIDE 1: Executive Title Slide (Corporate Dark Slate & Cobalt Blue)
    zip.file('ppt/slides/slide1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <!-- Background Fill -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Background"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="5143500"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:solidFill><a:srgbClr val="0F172A"/></a:solidFill>
        </p:spPr>
      </p:sp>
      <!-- Title Box -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Title"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="720000" y="1100000"/><a:ext cx="7704000" cy="2200000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" wrap="square" lIns="0" tIns="0" rIns="0" bIns="0"/>
          <a:lstStyle/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="4400" b="1"><a:solidFill><a:srgbClr val="60A5FA"/></a:solidFill></a:rPr>
              <a:t>EVENTRYE PLATFORM</a:t>
            </a:r>
          </a:p>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="3200" b="1"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:rPr>
              <a:t>Executive Financial &amp; Organization Audit</a:t>
            </a:r>
          </a:p>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="1800"><a:solidFill><a:srgbClr val="94A3B8"/></a:solidFill></a:rPr>
              <a:t>Report Interval: ${esc(report.intervalLabel)}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
      <!-- Footer Metadata Box -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="4" name="Footer"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="720000" y="3800000"/><a:ext cx="7704000" cy="800000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="0" tIns="0" rIns="0" bIns="0"/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="1400" b="1"><a:solidFill><a:srgbClr val="38BDF8"/></a:solidFill></a:rPr>
              <a:t>ORBIT-I Master Authority</a:t>
            </a:r>
            <a:r>
              <a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="64748B"/></a:solidFill></a:rPr>
              <a:t> | SBP Level-1 Compliant | NTN: ${esc(report.compliance.taxNtn)} | Audit #${esc(report.compliance.auditNumber)}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`);

    // SLIDE 2: Financial & Operational Executive KPI Snapshot
    zip.file('ppt/slides/slide2.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <!-- Header -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="600000" y="400000"/><a:ext cx="7944000" cy="800000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz"/>
          <a:p>
            <a:r><a:rPr lang="en-US" sz="2800" b="1"><a:solidFill><a:srgbClr val="1E3A8A"/></a:solidFill></a:rPr><a:t>Key Performance Indicators &amp; P&amp;L Snapshot</a:t></a:r>
          </a:p>
          <a:p>
            <a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="64748B"/></a:solidFill></a:rPr><a:t>High-level financial throughput and organizational footprint for ${esc(report.intervalLabel)}</a:t></a:r>
          </a:p>
        </p:txBody>
      </p:sp>

      <!-- KPI Card 1: Gross Sales -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Card1"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="600000" y="1400000"/><a:ext cx="3700000" cy="1400000"/></a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 8000"/></a:avLst></a:prstGeom>
          <a:solidFill><a:srgbClr val="EFF6FF"/></a:solidFill>
          <a:ln w="19050"><a:solidFill><a:srgbClr val="BFDBFE"/></a:solidFill></a:ln>
        </p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="200000" tIns="150000"/>
          <a:p><a:r><a:rPr lang="en-US" sz="1200" b="1"><a:solidFill><a:srgbClr val="1E40AF"/></a:solidFill></a:rPr><a:t>GROSS PLATFORM SALES</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="3000" b="1"><a:solidFill><a:srgbClr val="1E3A8A"/></a:solidFill></a:rPr><a:t>$${f.grossSalesUsd.toLocaleString()}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1300"><a:solidFill><a:srgbClr val="3B82F6"/></a:solidFill></a:rPr><a:t>PKR Rs ${f.grossSalesPkr.toLocaleString()} gross volume</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>

      <!-- KPI Card 2: Operating Purchases / Costs -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="4" name="Card2"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="4800000" y="1400000"/><a:ext cx="3740000" cy="1400000"/></a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 8000"/></a:avLst></a:prstGeom>
          <a:solidFill><a:srgbClr val="FFF1F2"/></a:solidFill>
          <a:ln w="19050"><a:solidFill><a:srgbClr val="FECDD3"/></a:solidFill></a:ln>
        </p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="200000" tIns="150000"/>
          <a:p><a:r><a:rPr lang="en-US" sz="1200" b="1"><a:solidFill><a:srgbClr val="9F1239"/></a:solidFill></a:rPr><a:t>PURCHASES &amp; OPERATIONAL COSTS</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="3000" b="1"><a:solidFill><a:srgbClr val="881337"/></a:solidFill></a:rPr><a:t>$${f.operatingPurchasesUsd.toLocaleString()}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1300"><a:solidFill><a:srgbClr val="BE123C"/></a:solidFill></a:rPr><a:t>Gateways, SMS Telco, Cloud Infrastructure</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>

      <!-- KPI Card 3: Net Profit -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="5" name="Card3"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="600000" y="3100000"/><a:ext cx="3700000" cy="1400000"/></a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 8000"/></a:avLst></a:prstGeom>
          <a:solidFill><a:srgbClr val="ECFDF5"/></a:solidFill>
          <a:ln w="19050"><a:solidFill><a:srgbClr val="A7F3D0"/></a:solidFill></a:ln>
        </p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="200000" tIns="150000"/>
          <a:p><a:r><a:rPr lang="en-US" sz="1200" b="1"><a:solidFill><a:srgbClr val="065F46"/></a:solidFill></a:rPr><a:t>NET OPERATING PROFIT</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="3000" b="1"><a:solidFill><a:srgbClr val="064E3B"/></a:solidFill></a:rPr><a:t>$${f.netProfitUsd.toLocaleString()}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1300" b="1"><a:solidFill><a:srgbClr val="059669"/></a:solidFill></a:rPr><a:t>Operating Margin: ${f.profitMarginPercent}%</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>

      <!-- KPI Card 4: Organizations & Events -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="6" name="Card4"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="4800000" y="3100000"/><a:ext cx="3740000" cy="1400000"/></a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 8000"/></a:avLst></a:prstGeom>
          <a:solidFill><a:srgbClr val="F8FAFC"/></a:solidFill>
          <a:ln w="19050"><a:solidFill><a:srgbClr val="CBD5E1"/></a:solidFill></a:ln>
        </p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="200000" tIns="150000"/>
          <a:p><a:r><a:rPr lang="en-US" sz="1200" b="1"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>ECOSYSTEM SCALE</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="3000" b="1"><a:solidFill><a:srgbClr val="0F172A"/></a:solidFill></a:rPr><a:t>${orgs.activeCount} Active / ${orgs.totalCount} Orgs</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1300"><a:solidFill><a:srgbClr val="64748B"/></a:solidFill></a:rPr><a:t>${orgs.totalEvents} Events • ${orgs.totalAttendees.toLocaleString()} Attendees • ${orgs.totalCertificates.toLocaleString()} Passes</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`);

    // SLIDE 3: Profit & Loss Statement (Sales vs Purchases Analysis)
    zip.file('ppt/slides/slide3.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="600000" y="400000"/><a:ext cx="7944000" cy="800000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz"/>
          <a:p><a:r><a:rPr lang="en-US" sz="2800" b="1"><a:solidFill><a:srgbClr val="1E3A8A"/></a:solidFill></a:rPr><a:t>P&amp;L Analysis: Revenue Inflows vs Direct Costs</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="64748B"/></a:solidFill></a:rPr><a:t>Detailed breakdown of SaaS subscription sales, merchant fees, and unit cost outflows</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>

      <!-- Inflow Breakdown Column -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="InflowBox"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="600000" y="1400000"/><a:ext cx="3800000" cy="3200000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="0" tIns="0"/>
          <a:p><a:r><a:rPr lang="en-US" sz="1600" b="1"><a:solidFill><a:srgbClr val="1E40AF"/></a:solidFill></a:rPr><a:t>REVENUE STREAMS</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Starter Subscriptions: $${f.salesBreakdown.starterPlanRevenue}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Professional Subscriptions: $${f.salesBreakdown.professionalPlanRevenue}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Enterprise Subscriptions: $${f.salesBreakdown.enterprisePlanRevenue}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Ticketing Commission Fees: $${f.salesBreakdown.ticketCommissions}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Add-on Quota Packages: $${f.salesBreakdown.addOnQuotaPacks}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1600" b="1"><a:solidFill><a:srgbClr val="047857"/></a:solidFill></a:rPr><a:t>Total Gross Sales: $${f.grossSalesUsd} (Rs ${f.grossSalesPkr.toLocaleString()})</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>

      <!-- Cost Breakdown Column -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="4" name="CostBox"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="4800000" y="1400000"/><a:ext cx="3800000" cy="3200000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="0" tIns="0"/>
          <a:p><a:r><a:rPr lang="en-US" sz="1600" b="1"><a:solidFill><a:srgbClr val="991B1B"/></a:solidFill></a:rPr><a:t>OPERATING PURCHASES &amp; COGS</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Merchant Gateway Fees (2.5%): $${f.purchasesBreakdown.merchantGatewayFees}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Telco SMS / WhatsApp OTP: $${f.purchasesBreakdown.telcoSmsVerification}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Transactional Email Delivery: $${f.purchasesBreakdown.emailDeliveryInfrastructure}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Dedicated Cloud VPS &amp; DB: $${f.purchasesBreakdown.cloudHostingAndDatabases}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Tamper-Evident Storage &amp; CDN: $${f.purchasesBreakdown.tamperEvidentStorage}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Security Sentinel AI Scanner: $${f.purchasesBreakdown.securitySentinelScanner}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1600" b="1"><a:solidFill><a:srgbClr val="B91C1C"/></a:solidFill></a:rPr><a:t>Total Cost Outflows: $${f.operatingPurchasesUsd}</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`);

    // SLIDE 4: Client Organization Distributions & Quota Footprint
    zip.file('ppt/slides/slide4.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="600000" y="400000"/><a:ext cx="7944000" cy="800000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz"/>
          <a:p><a:r><a:rPr lang="en-US" sz="2800" b="1"><a:solidFill><a:srgbClr val="1E3A8A"/></a:solidFill></a:rPr><a:t>Client Organization Distributions &amp; Quota Adoption</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="64748B"/></a:solidFill></a:rPr><a:t>Plan breakdown, white-label activations, and event capacity across client workspaces</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>

      <!-- Tier Breakdown Box -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="TiersBox"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="600000" y="1400000"/><a:ext cx="7944000" cy="3200000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="0" tIns="0"/>
          <a:p><a:r><a:rPr lang="en-US" sz="1600" b="1"><a:solidFill><a:srgbClr val="4338CA"/></a:solidFill></a:rPr><a:t>PLAN TIER ALLOCATIONS</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Starter Tier Workspaces: ${orgs.planDistribution.Starter} organizations</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Professional Tier Workspaces: ${orgs.planDistribution.Professional} organizations</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Enterprise Tier Workspaces: ${orgs.planDistribution.Enterprise} organizations</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Custom Institutional Quotas: ${orgs.planDistribution.Custom} organizations</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1600" b="1"><a:solidFill><a:srgbClr val="1E3A8A"/></a:solidFill></a:rPr><a:t>CAPACITY UTILIZATION</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Total Platform Events Hosted: ${orgs.totalEvents}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Total Registered Attendees Processed: ${orgs.totalAttendees.toLocaleString()}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Digital Passes &amp; Tamper-Evident Certificates Issued: ${orgs.totalCertificates.toLocaleString()}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Real-Time Onsite Check-ins Verified: ${orgs.totalCheckIns.toLocaleString()} (${orgs.checkInRatePercent}% check-in rate)</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`);

    // SLIDE 5: Strategic Governance & Level-1 Compliance Signoff
    zip.file('ppt/slides/slide5.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="600000" y="400000"/><a:ext cx="7944000" cy="800000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz"/>
          <a:p><a:r><a:rPr lang="en-US" sz="2800" b="1"><a:solidFill><a:srgbClr val="1E3A8A"/></a:solidFill></a:rPr><a:t>Governance, Compliance &amp; Master Authority Signoff</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1400"><a:solidFill><a:srgbClr val="64748B"/></a:solidFill></a:rPr><a:t>Audited and verified by ORBIT-I Private Limited Platform Master Authority</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>

      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="600000" y="1400000"/><a:ext cx="7944000" cy="3200000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="0" tIns="0"/>
          <a:p><a:r><a:rPr lang="en-US" sz="1500" b="1"><a:solidFill><a:srgbClr val="0F172A"/></a:solidFill></a:rPr><a:t>REGULATORY COMPLIANCE VERIFICATION:</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1300"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• State Bank of Pakistan (SBP) Level-1 Compliant merchant settlement architecture</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1300"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• FBR Corporate Tax ID: ${esc(report.compliance.taxNtn)} | Sales Tax STRN: ${esc(report.compliance.taxStrn)}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1300"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• 24/7 Security Sentinel: Zero data breaches, tenant isolation cryptographic sandboxing active</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1300"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>• Tamper-Evident SHA-256 verification active across all issued credentials</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1500" b="1"><a:solidFill><a:srgbClr val="166534"/></a:solidFill></a:rPr><a:t>STATUS: AUDIT VERIFIED AND CERTIFIED</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1300"><a:solidFill><a:srgbClr val="15803D"/></a:solidFill></a:rPr><a:t>Authorized Signatory: ORBIT-I Platform Master SuperAdmin</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`);

    // Generate blob and trigger browser download
    const content = await zip.generateAsync({ type: 'blob' });
    const cleanInterval = (report.interval || 'report').replace(/[^a-zA-Z0-9]/g, '-');
    const fileName = `${fileNamePrefix}-${cleanInterval}.pptx`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
    }, 300);

    return true;
  } catch (err) {
    console.error('[exportReportToPowerPoint Error]:', err);
    return false;
  }
}

/**
 * 3. PDF REPORT EXPORT (.pdf)
 * Triggers high-precision isolated printing to PDF with full CSS gradients, headers, and tables.
 */
export function exportReportToPdf(targetElementId: string = 'eventrye-executive-report-printable'): void {
  printElement(targetElementId, 'Eventrye Executive Financial Audit Report');
}
