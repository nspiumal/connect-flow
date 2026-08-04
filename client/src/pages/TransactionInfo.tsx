import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageWrapper from "@/vendor/facit/layout/PageWrapper/PageWrapper";
import SubHeader, { SubHeaderLeft } from "@/vendor/facit/layout/SubHeader/SubHeader";
import Breadcrumb from "@/vendor/facit/components/bootstrap/Breadcrumb";
import Page from "@/vendor/facit/layout/Page/Page";
import Card, { CardBody, CardHeader, CardTitle } from "@/vendor/facit/components/bootstrap/Card";
import Badge from "@/vendor/facit/components/bootstrap/Badge";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { notify } from "@/components/facit/notify";
import apiClient from "@/integrations/api";
import { formatWeight } from "@/lib/utils";
import { BLACKLISTED_STATUS, STATUS_COLOR, STATUS_LABEL } from "@/lib/transactionStatus";

interface ItemDetail {
  description: string;
  content: string;
  condition: string;
  weightGrams: number;
  karat: string | number;
  appraisedValue: number;
  images: string[];
}

interface TransactionHistory {
  id: string;
  editedByName?: string;
  editedBy?: string;
  editType?: string;
  previousStatus?: string;
  previousAddress?: string;
  previousPhone?: string;
  previousLoanAmount?: number;
  previousInterestRateId?: string;
  previousPeriodMonths?: number;
  previousMaturityDate?: string;
  previousRemarks?: string;
  newStatus?: string;
  newAddress?: string;
  newPhone?: string;
  newLoanAmount?: number;
  newInterestRateId?: string;
  newPeriodMonths?: number;
  newMaturityDate?: string;
  newRemarks?: string;
  blockReason?: string;
  policeReportNumber?: string;
  policeReportDate?: string;
  createdAt?: string;
}

interface RawTransaction {
  pawnId?: string; pawn_id?: string;
  customerName?: string; customer_name?: string;
  customer?: { fullName?: string; gender?: string; nic?: string; phone?: string; address?: string };
  gender?: string;
  idType?: string; id_type?: string;
  customerNic?: string; customer_nic?: string;
  customerPhone?: string; customer_phone?: string;
  customerAddress?: string; customer_address?: string;
  itemDetails?: unknown[]; items?: unknown[];
  itemDescription?: string; itemContent?: string; itemCondition?: string;
  itemWeightGrams?: number; itemKarat?: string | number; appraisedValue?: number;
  imageUrls?: string[]; images?: string[];
  loanAmount?: number; loan_amount?: number;
  interestRatePercent?: number; interest_rate_percent?: number;
  periodMonths?: number; period_months?: number;
  pawnDate?: string; pawn_date?: string;
  maturityDate?: string; maturity_date?: string;
  status?: string;
  remarks?: string;
}

interface BlacklistEntry {
  reason?: string;
  policeReportNumber?: string;
  policeReportDate?: string;
  createdAt?: string;
}

export default function TransactionInfo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loadingData, setLoadingData] = useState(true);
  const [transaction, setTransaction] = useState<RawTransaction | null>(null);
  const [items, setItems] = useState<ItemDetail[]>([]);
  const [imageBlobUrls, setImageBlobUrls] = useState<{ [key: string]: string }>({});
  const [history, setHistory] = useState<TransactionHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [blacklistEntry, setBlacklistEntry] = useState<BlacklistEntry | null>(null);

  useEffect(() => {
    if (id) {
      fetchTransaction(id);
      fetchHistory(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadImageWithAuth = async (imageUrl: string, imageKey: string) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const token = localStorage.getItem("token");
      let fullImageUrl = imageUrl;
      if (!imageUrl.startsWith("http") && !imageUrl.startsWith("data:")) {
        fullImageUrl = imageUrl.includes("pawn-transactions")
          ? `${apiBaseUrl}/images/pawn-transactions/${imageUrl.split("pawn-transactions/")[1]}`
          : `${apiBaseUrl}${imageUrl}`;
      }
      const response = await fetch(fullImageUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
      if (!response.ok) return;
      const blob = await response.blob();
      setImageBlobUrls((prev) => ({ ...prev, [imageKey]: URL.createObjectURL(blob) }));
    } catch (error) {
      console.error("Failed to load image:", error);
    }
  };

  const fetchTransaction = async (transactionId: string) => {
    try {
      setLoadingData(true);
      const response: RawTransaction = await apiClient.pawnTransactions.getById(transactionId);
      setTransaction(response);

      // A blacklisted ticket renders as customer info only, and its reason /
      // police report live on the blacklist entry rather than the transaction.
      if (response.status === BLACKLISTED_STATUS) {
        const nic = response.customerNic || response.customer_nic || response.customer?.nic;
        if (nic) {
          const result = await apiClient.blacklist.checkByNic(nic).catch(() => null);
          setBlacklistEntry(result?.entries?.[0] || null);
        }
        return;
      }

      const rawItems = response.itemDetails || response.items;

      if (rawItems && Array.isArray(rawItems) && rawItems.length > 0) {
        const itemsWithImages: ItemDetail[] = rawItems.map((raw) => {
          const item = raw as Record<string, unknown>;
          const rawImages = (item.imageUrls || item.images || []) as unknown[];
          const imageUrls: string[] = rawImages
            .map((img) => (typeof img === "string" ? img : (img as { imageUrl?: string })?.imageUrl || ""))
            .filter(Boolean);
          return {
            description: (item.itemDescription || item.description || "") as string,
            content: (item.itemContent || item.content || "") as string,
            condition: (item.itemCondition || item.condition || "Good") as string,
            weightGrams: (item.itemWeightGrams || item.weightGrams || 0) as number,
            karat: (item.itemKarat ?? item.karat ?? 24) as string | number,
            appraisedValue: (item.appraisedValue || 0) as number,
            images: imageUrls,
          };
        });
        setItems(itemsWithImages);
        itemsWithImages.forEach((item, itemIndex) => {
          item.images.forEach((imageUrl, imageIndex) => loadImageWithAuth(imageUrl, `${itemIndex}-${imageIndex}`));
        });
      } else {
        const singleItem: ItemDetail = {
          description: response.itemDescription || "",
          content: response.itemContent || "",
          condition: response.itemCondition || "Good",
          weightGrams: response.itemWeightGrams || 0,
          karat: response.itemKarat ?? 24,
          appraisedValue: response.appraisedValue || 0,
          images: response.imageUrls || response.images || [],
        };
        setItems([singleItem]);
        singleItem.images.forEach((imageUrl, index) => loadImageWithAuth(imageUrl, `0-${index}`));
      }
    } catch (error) {
      console.error("Failed to fetch transaction:", error);
      notify({ title: "Error", description: "Failed to load transaction details", variant: "destructive" });
      navigate("/transactions");
    } finally {
      setLoadingData(false);
    }
  };

  const fetchHistory = async (transactionId: string) => {
    try {
      setHistoryLoading(true);
      const response = await apiClient.pawnTransactions.getHistory(transactionId, 10);
      setHistory(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getImageSrc = (imageUrl: string, imageKey: string) => {
    if (imageBlobUrls[imageKey]) return imageBlobUrls[imageKey];
    if (imageUrl.startsWith("data:") || imageUrl.startsWith("http")) return imageUrl;
    return "";
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
  };

  const renderChange = (label: string, previousValue?: string | number, newValue?: string | number) => {
    if (previousValue == null && newValue == null) return null;
    return (
      <div className="small text-body-secondary">
        <span className="fw-medium">{label}:</span> {previousValue ?? "—"} → {newValue ?? "—"}
      </div>
    );
  };

  if (loadingData) {
    return <LoadingOverlay isLoading={true} message="Loading transaction details..." />;
  }

  const status = transaction?.status || "Active";
  const isBlacklisted = status === BLACKLISTED_STATUS;

  const customerInformation = (
    <div className="row g-3 small">
      <div className="col-6">
        <div className="text-muted" style={{ fontSize: "0.75rem" }}>Customer Name</div>
        <p className="fw-medium mb-0">{transaction?.customerName || transaction?.customer_name || transaction?.customer?.fullName || "N/A"}</p>
      </div>
      <div className="col-6">
        <div className="text-muted" style={{ fontSize: "0.75rem" }}>Gender</div>
        <p className="fw-medium mb-0">{transaction?.gender || transaction?.customer?.gender || "N/A"}</p>
      </div>
      <div className="col-6">
        <div className="text-muted" style={{ fontSize: "0.75rem" }}>ID Type</div>
        <p className="fw-medium mb-0">{transaction?.idType || transaction?.id_type || "NIC"}</p>
      </div>
      <div className="col-6">
        <div className="text-muted" style={{ fontSize: "0.75rem" }}>ID Number</div>
        <p className="fw-medium mb-0">{transaction?.customerNic || transaction?.customer_nic || transaction?.customer?.nic || "N/A"}</p>
      </div>
      <div className="col-6">
        <div className="text-muted" style={{ fontSize: "0.75rem" }}>Phone</div>
        <p className="fw-medium mb-0">{transaction?.customerPhone || transaction?.customer_phone || transaction?.customer?.phone || "N/A"}</p>
      </div>
      <div className="col-6">
        <div className="text-muted" style={{ fontSize: "0.75rem" }}>Address</div>
        <p className="fw-medium text-truncate mb-0">{transaction?.customerAddress || transaction?.customer_address || transaction?.customer?.address || "N/A"}</p>
      </div>
    </div>
  );

  const breadcrumb = (
    <SubHeader>
      <SubHeaderLeft>
        <Breadcrumb
          list={[
            { title: "Pawn Transactions", to: "/transactions" },
            { title: transaction?.pawnId || transaction?.pawn_id || "Info", to: `/transactions/info/${id}` },
          ]}
        />
      </SubHeaderLeft>
    </SubHeader>
  );

  // A blacklisted ticket shows the customer's information and why they were
  // blacklisted — nothing else, and no actions.
  if (isBlacklisted) {
    return (
      <PageWrapper title="Transaction Info">
        {breadcrumb}
        <Page>
          <div className="row g-4">
            <div className="col-12 col-lg-6 d-flex flex-column gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="fs-6">Customer Information</CardTitle>
                  <Badge color="danger">{STATUS_LABEL[BLACKLISTED_STATUS]}</Badge>
                </CardHeader>
                <CardBody className="pt-0">{customerInformation}</CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="fs-6">Blacklist Details</CardTitle>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="row g-3 small">
                    <div className="col-12">
                      <div className="text-danger" style={{ fontSize: "0.75rem" }}>Reason</div>
                      <p className="fw-medium text-danger mb-0">{blacklistEntry?.reason || "—"}</p>
                    </div>
                    <div className="col-6">
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>Police Report No.</div>
                      <p className="fw-medium mb-0">{blacklistEntry?.policeReportNumber || "—"}</p>
                    </div>
                    <div className="col-6">
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>Police Report Date</div>
                      <p className="fw-medium mb-0">
                        {blacklistEntry?.policeReportDate ? new Date(blacklistEntry.policeReportDate).toLocaleDateString() : "—"}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </Page>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Transaction Info">
      {breadcrumb}
      <Page>
        <div className="row g-4">
          <div className="col-12 col-lg-6 d-flex flex-column gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="fs-6">Customer Information</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">{customerInformation}</CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="fs-6">Item Details ({items.length})</CardTitle>
              </CardHeader>
              <CardBody className="pt-0 d-flex flex-column gap-3">
                {items.map((item, itemIndex) => (
                  <div key={itemIndex} className="p-3 rounded border bg-body-tertiary small">
                    <p className="text-muted fw-semibold" style={{ fontSize: "0.75rem" }}>Item {itemIndex + 1}</p>
                    <div className="row g-2">
                      <div className="col-12">
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>Description</div>
                        <p className="fw-medium mb-0">{item.description || "N/A"}</p>
                      </div>
                      <div className="col-4">
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>Weight</div>
                        <p className="fw-medium mb-0">{formatWeight(item.weightGrams)}g</p>
                      </div>
                      <div className="col-4">
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>Karat</div>
                        <p className="fw-medium mb-0">{item.karat === "N/A" || String(item.karat).includes("K") ? item.karat : `${item.karat}K`}</p>
                      </div>
                      <div className="col-4">
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>Condition</div>
                        <p className="fw-medium mb-0">{item.condition}</p>
                      </div>
                      <div className="col-6">
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>Content/Type</div>
                        <p className="fw-medium mb-0">{item.content || "N/A"}</p>
                      </div>
                      <div className="col-6">
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>Appraised Value</div>
                        <p className="fw-medium mb-0">Rs. {item.appraisedValue.toLocaleString()}</p>
                      </div>
                    </div>

                    {item.images && item.images.length > 0 && (
                      <div className="pt-2">
                        <div className="text-muted d-flex align-items-center gap-1 mb-2" style={{ fontSize: "0.75rem" }}>
                          Images ({item.images.length})
                        </div>
                        <div className="row g-2">
                          {item.images.map((imageUrl, imageIndex) => (
                            <div key={imageIndex} className="col-4">
                              <img
                                src={getImageSrc(imageUrl, `${itemIndex}-${imageIndex}`)}
                                alt={`Item ${itemIndex + 1} Image ${imageIndex + 1}`}
                                className="w-100 rounded border"
                                style={{ height: 80, objectFit: "cover" }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          <div className="col-12 col-lg-6 d-flex flex-column gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="fs-6">Transaction Details</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="row g-3 small">
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>Loan Amount</div>
                    <p className="fw-medium mb-0">Rs. {Number(transaction?.loanAmount || transaction?.loan_amount || 0).toLocaleString()}</p>
                  </div>
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>Interest Rate</div>
                    <p className="fw-medium mb-0">{transaction?.interestRatePercent || transaction?.interest_rate_percent}%</p>
                  </div>
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>Period</div>
                    <p className="fw-medium mb-0">{transaction?.periodMonths || transaction?.period_months} months</p>
                  </div>
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>Pawn Date</div>
                    <p className="fw-medium mb-0">{transaction?.pawnDate || transaction?.pawn_date || "N/A"}</p>
                  </div>
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>Maturity Date</div>
                    <p className="fw-medium mb-0">{transaction?.maturityDate || transaction?.maturity_date || "N/A"}</p>
                  </div>
                  <div className="col-6">
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>Status</div>
                    <div>
                      <Badge color={STATUS_COLOR[status] ?? "danger"}>
                        {STATUS_LABEL[status] ?? status}
                      </Badge>
                    </div>
                  </div>
                  {transaction?.remarks && (
                    <div className="col-12">
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>Remarks</div>
                      <p className="fw-medium small mb-0">{transaction.remarks}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="fs-6">Edit History (Last 10)</CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                {historyLoading ? (
                  <p className="small text-muted mb-0">Loading history...</p>
                ) : history.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {history.map((entry) => (
                      <div key={entry.id} className="p-3 border rounded bg-body-tertiary">
                        <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                          <Badge color="secondary" isLight>{entry.editType || "EDIT"}</Badge>
                          <span className="small fw-medium">{entry.editedByName || entry.editedBy || "Unknown"}</span>
                          <span className="small text-muted">{formatDateTime(entry.createdAt)}</span>
                        </div>

                        {renderChange("Status", entry.previousStatus, entry.newStatus)}
                        {renderChange("Address", entry.previousAddress, entry.newAddress)}
                        {renderChange("Phone", entry.previousPhone, entry.newPhone)}

                        {entry.editType === "REDEMPTION" && entry.newLoanAmount != null && (
                          <div className="small text-body-secondary">
                            <span className="fw-medium">Remaining Balance:</span>{" "}
                            <span className="text-warning fw-semibold">Rs. {Number(entry.newLoanAmount).toLocaleString()}</span>
                          </div>
                        )}
                        {entry.editType !== "REDEMPTION" && renderChange("Loan Amount", entry.previousLoanAmount, entry.newLoanAmount)}
                        {renderChange("Period (Months)", entry.previousPeriodMonths, entry.newPeriodMonths)}
                        {renderChange("Maturity Date", entry.previousMaturityDate, entry.newMaturityDate)}

                        {entry.editType === "REDEMPTION" && entry.newRemarks && (
                          <div className="small bg-l10-info p-2 rounded border mt-1">
                            <span className="fw-medium">Payment Details:</span>
                            <p className="mt-0.5 mb-0">{entry.newRemarks}</p>
                          </div>
                        )}
                        {entry.editType !== "REDEMPTION" && renderChange("Remarks", entry.previousRemarks, entry.newRemarks)}

                        {entry.blockReason && (
                          <div className="small text-body-secondary">
                            <span className="fw-medium">Block Reason:</span> {entry.blockReason}
                          </div>
                        )}
                        {entry.policeReportNumber && (
                          <div className="small text-body-secondary">
                            <span className="fw-medium">Police Report No.:</span> {entry.policeReportNumber}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="small text-muted mb-0">No edit history found.</p>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </Page>
    </PageWrapper>
  );
}
