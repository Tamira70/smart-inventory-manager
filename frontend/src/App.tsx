import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ChangeEvent,
  CSSProperties,
  Dispatch,
  FormEvent,
  KeyboardEvent,
  RefObject,
  SetStateAction,
} from "react";
import LoginForm from "./LoginForm";
import { apiFetch } from "./api";
import { clearTokens, getUser, isLoggedIn } from "./auth";

type Product = {
  id: number;
  name: string;
  sku: string;
  description: string;
  quantity: number;
  min_stock: number;
  unit: string;
};

type StockMovement = {
  id: number;
  product: number;
  product_name: string;
  movement_type: "IN" | "OUT";
  quantity: number;
  reference_number?: string;
  note?: string;
  created_by_username?: string;
  created_at: string;
};

type InventorySession = {
  id: number;
  title: string;
  status: "OPEN" | "COMPLETED";
  note: string;
  created_by?: number;
  created_by_username?: string;
  created_at: string;
  completed_at: string | null;
  counts_total: number;
  counts_done: number;
};

type InventoryCount = {
  id: number;
  session: number;
  session_title: string;
  product: number;
  product_name: string;
  product_sku: string;
  product_unit: string;
  expected_quantity: number;
  counted_quantity: number | null;
  difference: number | null;
  note: string;
  corrected: boolean;
  correction_movement: number | null;
  created_by?: number;
  created_by_username?: string;
  created_at: string;
  updated_at: string;
};

type ProductForm = {
  name: string;
  sku: string;
  description: string;
  quantity: string;
  min_stock: string;
  unit: string;
};

type ActiveSection =
  | "dashboard"
  | "orders"
  | "product"
  | "suppliers"
  | "stock-overview"
  | "min-stock"
  | "reorder"
  | "inventory"
  | "goods-in"
  | "goods-out"
  | "history"
  | "corrections"
  | "locations"
  | "customers"
  | "contacts"
  | "addresses"
  | "customer-notes"
  | "admin-users"
  | "admin-rights"
  | "admin-locations"
  | "admin-audit";

type SidebarMenu = {
  id: string;
  title: string;
  icon: string;
  items: {
    id: ActiveSection;
    label: string;
  }[];
};

type PermissionRole = "admin" | "lager";

type InventorySummary = {
  total: number;
  done: number;
  differences: number;
  corrected: number;
};

type ReorderSuggestion = Product & {
  targetStock: number;
  suggestedQuantity: number;
};

type PurchaseOrderDraft = {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  status: "DRAFT" | "APPROVED";
  createdAt: string;
  approvedAt?: string;
  orderNumber?: string;
};

const initialForm: ProductForm = {
  name: "",
  sku: "",
  description: "",
  quantity: "",
  min_stock: "",
  unit: "Stück",
};

const unitOptions = ["Stück", "kg", "Liter", "Box", "Palette"];

const sidebarMenus: SidebarMenu[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: "📊",
    items: [{ id: "dashboard", label: "Übersicht" }],
  },
  {
    id: "einkauf",
    title: "Einkauf",
    icon: "🛒",
    items: [
      { id: "orders", label: "Bestellungen" },
      { id: "product", label: "Produkte / Artikelstamm" },
      { id: "suppliers", label: "Lieferanten" },
      { id: "stock-overview", label: "Bestandsübersicht" },
    ],
  },
  {
    id: "dispo",
    title: "Dispo",
    icon: "📋",
    items: [
      { id: "stock-overview", label: "Bestandsübersicht" },
      { id: "min-stock", label: "Mindestbestände" },
      { id: "reorder", label: "Nachbestellvorschläge" },
      { id: "inventory", label: "Inventur" },
      { id: "history", label: "Bewegungshistorie" },
    ],
  },
  {
    id: "lager",
    title: "Lager",
    icon: "🏭",
    items: [
      { id: "goods-in", label: "Wareneingang" },
      { id: "goods-out", label: "Warenausgang" },
      { id: "history", label: "Bewegungshistorie" },
      { id: "corrections", label: "Lagerkorrekturen" },
      { id: "locations", label: "Lagerorte" },
      { id: "stock-overview", label: "Bestandsübersicht" },
    ],
  },
  {
    id: "kundenstamm",
    title: "Kundenstamm",
    icon: "👥",
    items: [
      { id: "customers", label: "Kundenliste" },
      { id: "contacts", label: "Ansprechpartner" },
      { id: "addresses", label: "Lieferadressen" },
      { id: "customer-notes", label: "Kundennotizen" },
    ],
  },
  {
    id: "admin",
    title: "Admin",
    icon: "⚙️",
    items: [
      { id: "admin-users", label: "Benutzer anlegen" },
      { id: "admin-rights", label: "Rollen & Zugriffsrechte" },
      { id: "admin-locations", label: "Lagerorte anlegen" },
      { id: "admin-audit", label: "Systemprotokoll" },
    ],
  },
];

function App() {
  const user = getUser();
  const role = user?.role ?? "viewer";

  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard");
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    "dashboard",
    "einkauf",
    "dispo",
    "lager",
  ]);
  const [isCompactLayout, setIsCompactLayout] = useState<boolean>(
    window.innerWidth < 920
  );

  const [purchaseOrderDrafts, setPurchaseOrderDrafts] = useState<
    PurchaseOrderDraft[]
  >(() => {
    const stored = window.localStorage.getItem(
      "smartInventoryPurchaseOrderDrafts"
    );

    if (!stored) return [];

    try {
      return JSON.parse(stored) as PurchaseOrderDraft[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(
      "smartInventoryPurchaseOrderDrafts",
      JSON.stringify(purchaseOrderDrafts)
    );
  }, [purchaseOrderDrafts]);

  const draftedProductIds = useMemo(() => {
    return new Set(purchaseOrderDrafts.map((draft) => draft.productId));
  }, [purchaseOrderDrafts]);

  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementProductFilter, setMovementProductFilter] = useState("");

  const [inventorySessions, setInventorySessions] = useState<InventorySession[]>([]);
  const [inventoryCounts, setInventoryCounts] = useState<InventoryCount[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySaving, setInventorySaving] = useState(false);
  const [inventoryCorrectionSavingId, setInventoryCorrectionSavingId] =
    useState<number | null>(null);
  const [inventoryTitle, setInventoryTitle] = useState("Inventur Mai 2026");
  const [inventoryNote, setInventoryNote] = useState("");
  const [selectedInventorySessionId, setSelectedInventorySessionId] = useState("");
  const [inventoryProductId, setInventoryProductId] = useState("");
  const [inventoryCountedQuantity, setInventoryCountedQuantity] = useState("");
  const [inventoryCountNote, setInventoryCountNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [search, setSearch] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const [movementProductId, setMovementProductId] = useState("");
  const [movementQuantity, setMovementQuantity] = useState("");
  const [movementReferenceNumber, setMovementReferenceNumber] = useState("");
  const [movementNote, setMovementNote] = useState("");
  const [movementSaving, setMovementSaving] = useState(false);
  const [movementSearch, setMovementSearch] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState<"" | "IN" | "OUT">("");

  const [goodsOutProductId, setGoodsOutProductId] = useState("");
  const [goodsOutQuantity, setGoodsOutQuantity] = useState("");
  const [goodsOutReferenceNumber, setGoodsOutReferenceNumber] = useState("");
  const [goodsOutNote, setGoodsOutNote] = useState("");
  const [goodsOutSaving, setGoodsOutSaving] = useState(false);

  const productNameRef = useRef<HTMLInputElement | null>(null);
  const productSkuRef = useRef<HTMLInputElement | null>(null);
  const productQuantityRef = useRef<HTMLInputElement | null>(null);
  const productMinStockRef = useRef<HTMLInputElement | null>(null);
  const productUnitRef = useRef<HTMLSelectElement | null>(null);
  const productDescriptionRef = useRef<HTMLTextAreaElement | null>(null);

  const goodsInProductRef = useRef<HTMLSelectElement | null>(null);
  const goodsInQuantityRef = useRef<HTMLInputElement | null>(null);

  const goodsOutProductRef = useRef<HTMLSelectElement | null>(null);
  const goodsOutQuantityRef = useRef<HTMLInputElement | null>(null);

  const inventoryProductRef = useRef<HTMLSelectElement | null>(null);
  const inventoryCountedQuantityRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const updateLayout = () => setIsCompactLayout(window.innerWidth < 920);
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((current) =>
      current.includes(menuId)
        ? current.filter((id) => id !== menuId)
        : [...current, menuId]
    );
  };

const selectSection = (section: ActiveSection) => {
  if (!canAccessSection(section)) {
    setError("Für diesen Bereich hast du keine Berechtigung.");
    return;
  }

  setActiveSection(section);
  setError("");
  setSuccess("");

  if (section === "min-stock") setShowLowStockOnly(true);

  if (section === "stock-overview" || section === "product") {
    setShowLowStockOnly(false);
  }
};
  const hasPermission = (required: PermissionRole) => {
    if (!role) return false;
    if (required === "admin") return role === "admin";
    if (required === "lager") return role === "admin" || role === "lager";
    return false;
  };

  const canAccessSection = (section: ActiveSection) => {
  if (role === "admin") return true;

  // Viewer darf alles anschauen, aber nichts bearbeiten/buchen.
  if (role === "viewer") return true;

  // Lager darf nur Lagerfunktionen und Dashboard sehen.
  if (role === "lager") {
    return [
      "dashboard",
      "goods-in",
      "goods-out",
      "history",
      "corrections",
      "locations",
      "stock-overview",
    ].includes(section);
  }

  return section === "dashboard";
};

const visibleSidebarMenus = useMemo(() => {
  if (role === "admin" || role === "viewer") {
    return sidebarMenus;
  }

  if (role === "lager") {
    return sidebarMenus
      .filter((menu) => menu.id === "dashboard" || menu.id === "lager")
      .map((menu) => ({
        ...menu,
        items: menu.items.filter((item) => canAccessSection(item.id)),
      }));
  }

  return sidebarMenus.filter((menu) => menu.id === "dashboard");
}, [role]);

  useEffect(() => {
    if (activeSection === "product") productNameRef.current?.focus();
    if (activeSection === "goods-in") goodsInProductRef.current?.focus();
    if (activeSection === "goods-out") goodsOutProductRef.current?.focus();
    if (activeSection === "inventory") inventoryProductRef.current?.focus();
  }, [activeSection]);

  const focusNextOnEnter = (
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    next?: HTMLElement | null
  ) => {
    if (event.key === "Enter" && !(event.target instanceof HTMLTextAreaElement)) {
      event.preventDefault();
      next?.focus();
    }
  };

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(""), 3000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiFetch("/inventory-api/products/");
      const data = (await response.json()) as Product[];
      setProducts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Laden.";
      setError(message);
      if (message.includes("Sitzung abgelaufen")) {
        clearTokens();
        setLoggedIn(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    try {
      setMovementsLoading(true);
      const response = await apiFetch("/inventory-api/stock-movements/");
      const data = (await response.json()) as StockMovement[];
      setMovements(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Laden der Bewegungen.";
      setError(message);
    } finally {
      setMovementsLoading(false);
    }
  };

  const loadInventorySessions = async () => {
    try {
      setInventoryLoading(true);
      const response = await apiFetch("/inventory-api/inventory-sessions/");
      const data = (await response.json()) as InventorySession[];
      setInventorySessions(data);
      if (!selectedInventorySessionId && data.length > 0) {
        const openSession = data.find((session) => session.status === "OPEN") ?? data[0];
        setSelectedInventorySessionId(String(openSession.id));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Laden der Inventuren.";
      setError(message);
    } finally {
      setInventoryLoading(false);
    }
  };

  const loadInventoryCounts = async (sessionId?: string) => {
    const targetSessionId = sessionId ?? selectedInventorySessionId;
    if (!targetSessionId) {
      setInventoryCounts([]);
      return;
    }
    try {
      setInventoryLoading(true);
      const response = await apiFetch(`/inventory-api/inventory-counts/?session=${targetSessionId}`);
      const data = (await response.json()) as InventoryCount[];
      setInventoryCounts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Laden der Inventurpositionen.";
      setError(message);
    } finally {
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    if (loggedIn) {
      void loadProducts();
      void loadMovements();
      void loadInventorySessions();
    }
  }, [loggedIn]);

  useEffect(() => {
    if (loggedIn && selectedInventorySessionId) {
      void loadInventoryCounts(selectedInventorySessionId);
    }
  }, [loggedIn, selectedInventorySessionId]);

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.quantity <= product.min_stock),
    [products]
  );

  const reorderSuggestions = useMemo<ReorderSuggestion[]>(() => {
    return products
      .filter((product) => product.quantity <= product.min_stock)
      .map((product) => {
        const targetStock = Math.max(
          product.min_stock * 2,
          product.min_stock + 1,
          1
        );

        const suggestedQuantity = Math.max(targetStock - product.quantity, 1);

        return {
          ...product,
          targetStock,
          suggestedQuantity,
        };
      });
  }, [products]);

  const selectedInventorySession = useMemo(() => {
    return inventorySessions.find((session) => String(session.id) === selectedInventorySessionId) ?? null;
  }, [inventorySessions, selectedInventorySessionId]);

  const selectedInventoryProduct = useMemo(() => {
    return products.find((product) => String(product.id) === inventoryProductId) ?? null;
  }, [products, inventoryProductId]);

  const countedProductIds = useMemo(() => {
    return new Set(inventoryCounts.map((count) => count.product));
  }, [inventoryCounts]);

  const inventorySummary = useMemo<InventorySummary>(() => {
    const total = inventoryCounts.length;
    const done = inventoryCounts.filter((count) => count.counted_quantity !== null).length;
    const differences = inventoryCounts.filter((count) => (count.difference ?? 0) !== 0).length;
    const corrected = inventoryCounts.filter((count) => count.corrected).length;
    return { total, done, differences, corrected };
  }, [inventoryCounts]);

  const filteredMovements = useMemo(() => {
    const query = movementSearch.trim().toLowerCase();
    return movements.filter((movement) => {
      const matchesSearch =
        movement.product_name.toLowerCase().includes(query) ||
        (movement.reference_number ?? "").toLowerCase().includes(query) ||
        (movement.note ?? "").toLowerCase().includes(query);
      const matchesType = movementTypeFilter === "" || movement.movement_type === movementTypeFilter;
      const matchesProduct = movementProductFilter === "" || movement.product_name === movementProductFilter;
      return matchesSearch && matchesType && matchesProduct;
    });
  }, [movements, movementSearch, movementTypeFilter, movementProductFilter]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const shouldShowLowStockOnly = activeSection === "min-stock" || showLowStockOnly;
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);
      const matchesLowStock = !shouldShowLowStockOnly || product.quantity <= product.min_stock;
      return matchesSearch && matchesLowStock;
    });
  }, [products, search, showLowStockOnly, activeSection]);

  const totalProducts = products.length;
  const totalUnits = products.reduce((sum, product) => sum + product.quantity, 0);
  const todayKey = new Date().toDateString();
  const goodsInToday = movements.filter(
    (movement) => movement.movement_type === "IN" && new Date(movement.created_at).toDateString() === todayKey
  ).length;
  const goodsOutToday = movements.filter(
    (movement) => movement.movement_type === "OUT" && new Date(movement.created_at).toDateString() === todayKey
  ).length;
  const latestMovement = movements[0] ?? null;
  const canShowProductOverview = ["product", "stock-overview", "min-stock"].includes(activeSection);

  const handleCreatePurchaseOrderDraft = (product: ReorderSuggestion) => {
    const alreadySent = purchaseOrderDrafts.some(
      (draft) => draft.productId === product.id
    );

    if (alreadySent) {
      setSuccess(`ℹ️ ${product.name} wurde bereits an den Einkauf gesendet.`);
      setActiveSection("orders");
      return;
    }

    setPurchaseOrderDrafts((current) => [
      {
        id: Date.now(),
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: product.suggestedQuantity,
        unit: product.unit,
        status: "DRAFT",
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);

    setSuccess(`📨 ${product.name} wurde an den Einkauf gesendet.`);
    setActiveSection("orders");
  };

  const handleApprovePurchaseOrderDraft = (draftId: number) => {
  setPurchaseOrderDrafts((current) =>
    current.map((draft) => {
      if (draft.id !== draftId) return draft;

      if (draft.status === "APPROVED") return draft;

      return {
        ...draft,
        status: "APPROVED",
        approvedAt: new Date().toISOString(),
        orderNumber: `PO-${new Date().getFullYear()}-${draft.id}`,
            };
          })
        );

        setSuccess("✅ Bestellung wurde freigegeben.");
      };

const handleLogout = () => {
    clearTokens();
    setLoggedIn(false);
    setProducts([]);
    setMovements([]);
    setInventorySessions([]);
    setInventoryCounts([]);
    setSelectedInventorySessionId("");
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleEdit = (product: Product) => {
    setActiveSection("product");
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description,
      quantity: String(product.quantity),
      min_stock: String(product.min_stock),
      unit: product.unit,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => productNameRef.current?.focus(), 0);
  };

  const validateProductForm = () => {
    if (!form.name.trim()) return "Produktname ist erforderlich.";
    if (!form.sku.trim()) return "SKU ist erforderlich.";
    if (!form.unit.trim()) return "Einheit ist erforderlich.";
    if (form.quantity === "" || Number(form.quantity) < 0) return "Bestand muss 0 oder größer sein.";
    if (form.min_stock === "" || Number(form.min_stock) < 0) return "Mindestbestand muss 0 oder größer sein.";
    return "";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    const validationError = validateProductForm();
    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }
    const payload = {
      name: form.name,
      sku: form.sku,
      description: form.description,
      quantity: Number(form.quantity),
      min_stock: Number(form.min_stock),
      unit: form.unit,
    };
    try {
      const response = await apiFetch(
        editingId === null ? "/inventory-api/products/" : `/inventory-api/products/${editingId}/`,
        { method: editingId === null ? "POST" : "PUT", body: JSON.stringify(payload) }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      resetForm();
      await loadProducts();
      setSuccess("✅ Produkt erfolgreich gespeichert!");
      setTimeout(() => productNameRef.current?.focus(), 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Speichern.";
      setError(message);
      if (message.includes("Sitzung abgelaufen")) {
        clearTokens();
        setLoggedIn(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUndoMovement = async (movement: StockMovement) => {
    const confirmed = window.confirm(
      `Willst du die Bewegung für "${movement.product_name}" wirklich rückgängig machen?`
    );
    if (!confirmed) return;
    try {
      setError("");
      setSuccess("");
      const response = await apiFetch("/inventory-api/stock-movements/", {
        method: "POST",
        body: JSON.stringify({
          product: movement.product,
          movement_type: movement.movement_type === "IN" ? "OUT" : "IN",
          quantity: movement.quantity,
          reference_number: `UNDO-${movement.reference_number ?? movement.id}`,
          note: `Rückgängig von Bewegung #${movement.id}`,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      await loadProducts();
      await loadMovements();
      setSuccess("🔄 Bewegung rückgängig gemacht!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Rückgängig machen.";
      setError(message);
    }
  };

  const validateGoodsReceiptForm = () => {
    if (!movementProductId) return "Bitte ein Produkt für den Wareneingang auswählen.";
    if (movementQuantity === "" || Number(movementQuantity) <= 0) return "Die Wareneingangs-Menge muss größer als 0 sein.";
    return "";
  };

  const handleGoodsReceipt = async (event: FormEvent) => {
    event.preventDefault();
    setMovementSaving(true);
    setError("");
    setSuccess("");
    const validationError = validateGoodsReceiptForm();
    if (validationError) {
      setError(validationError);
      setMovementSaving(false);
      return;
    }
    try {
      const response = await apiFetch("/inventory-api/stock-movements/", {
        method: "POST",
        body: JSON.stringify({
          product: Number(movementProductId),
          movement_type: "IN",
          quantity: Number(movementQuantity),
          reference_number: movementReferenceNumber,
          note: movementNote,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      setMovementProductId("");
      setMovementQuantity("");
      setMovementReferenceNumber("");
      setMovementNote("");
      await loadProducts();
      await loadMovements();
      setSuccess("📥 Wareneingang erfolgreich gebucht!");
      setTimeout(() => goodsInProductRef.current?.focus(), 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Wareneingang.";
      setError(message);
      if (message.includes("Sitzung abgelaufen")) {
        clearTokens();
        setLoggedIn(false);
      }
    } finally {
      setMovementSaving(false);
    }
  };

  const validateGoodsIssueForm = () => {
    if (!goodsOutProductId) return "Bitte ein Produkt für den Warenausgang auswählen.";
    if (goodsOutQuantity === "" || Number(goodsOutQuantity) <= 0) return "Die Warenausgangs-Menge muss größer als 0 sein.";
    return "";
  };

  const handleGoodsIssue = async (event: FormEvent) => {
    event.preventDefault();
    setGoodsOutSaving(true);
    setError("");
    setSuccess("");
    const validationError = validateGoodsIssueForm();
    if (validationError) {
      setError(validationError);
      setGoodsOutSaving(false);
      return;
    }
    try {
      const response = await apiFetch("/inventory-api/stock-movements/", {
        method: "POST",
        body: JSON.stringify({
          product: Number(goodsOutProductId),
          movement_type: "OUT",
          quantity: Number(goodsOutQuantity),
          reference_number: goodsOutReferenceNumber,
          note: goodsOutNote,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      setGoodsOutProductId("");
      setGoodsOutQuantity("");
      setGoodsOutReferenceNumber("");
      setGoodsOutNote("");
      await loadProducts();
      await loadMovements();
      setSuccess("📤 Warenausgang erfolgreich gebucht!");
      setTimeout(() => goodsOutProductRef.current?.focus(), 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Warenausgang.";
      setError(message);
      if (message.includes("Sitzung abgelaufen")) {
        clearTokens();
        setLoggedIn(false);
      }
    } finally {
      setGoodsOutSaving(false);
    }
  };

  const handleCreateInventorySession = async (event: FormEvent) => {
    event.preventDefault();
    if (!inventoryTitle.trim()) {
      setError("Bitte einen Titel für die Inventur eintragen.");
      return;
    }
    try {
      setInventorySaving(true);
      setError("");
      setSuccess("");
      const response = await apiFetch("/inventory-api/inventory-sessions/", {
        method: "POST",
        body: JSON.stringify({ title: inventoryTitle, note: inventoryNote }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      const createdSession = (await response.json()) as InventorySession;
      setSelectedInventorySessionId(String(createdSession.id));
      setInventoryTitle("");
      setInventoryNote("");
      await loadInventorySessions();
      await loadInventoryCounts(String(createdSession.id));
      setSuccess("🧾 Inventur-Runde erstellt!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Erstellen der Inventur.";
      setError(message);
    } finally {
      setInventorySaving(false);
    }
  };

  const handleAddInventoryCount = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedInventorySessionId) {
      setError("Bitte zuerst eine Inventur-Runde auswählen oder erstellen.");
      return;
    }
    if (!inventoryProductId) {
      setError("Bitte ein Produkt für die Inventur auswählen.");
      return;
    }
    const alreadyCounted = inventoryCounts.find(
      (count) => count.product === Number(inventoryProductId)
    );
    if (alreadyCounted) {
      setError("Dieses Produkt wurde in dieser Inventur bereits gezählt. Bitte nutze die vorhandene Inventurposition oder starte eine neue Inventur.");
      return;
    }
    if (inventoryCountedQuantity === "" || Number(inventoryCountedQuantity) < 0) {
      setError("Die gezählte Menge muss 0 oder größer sein.");
      return;
    }
    try {
      setInventorySaving(true);
      setError("");
      setSuccess("");
      const response = await apiFetch("/inventory-api/inventory-counts/", {
        method: "POST",
        body: JSON.stringify({
          session: Number(selectedInventorySessionId),
          product: Number(inventoryProductId),
          counted_quantity: Number(inventoryCountedQuantity),
          note: inventoryCountNote,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      setInventoryProductId("");
      setInventoryCountedQuantity("");
      setInventoryCountNote("");
      await loadInventoryCounts(selectedInventorySessionId);
      await loadInventorySessions();
      setSuccess("✅ Inventurposition gespeichert!");
      setTimeout(() => inventoryProductRef.current?.focus(), 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Speichern der Inventurposition.";
      setError(message);
    } finally {
      setInventorySaving(false);
    }
  };

  const handleApplyInventoryCorrection = async (count: InventoryCount) => {
    if (count.corrected) return;
    const confirmed = window.confirm(
      `Korrektur für "${count.product_name}" buchen?\n\nSoll: ${count.expected_quantity}\nIst: ${count.counted_quantity}\nDifferenz: ${count.difference}`
    );
    if (!confirmed) return;
    try {
      setInventoryCorrectionSavingId(count.id);
      setError("");
      setSuccess("");
      const response = await apiFetch(`/inventory-api/inventory-counts/${count.id}/apply-correction/`, { method: "POST" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      await loadInventoryCounts(selectedInventorySessionId);
      await loadInventorySessions();
      await loadProducts();
      await loadMovements();
      setSuccess("🔧 Inventur-Korrektur gebucht!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Buchen der Inventur-Korrektur.";
      setError(message);
    } finally {
      setInventoryCorrectionSavingId(null);
    }
  };

  const handleCompleteInventorySession = async () => {
    if (!selectedInventorySession) {
      setError("Bitte zuerst eine Inventur auswählen.");
      return;
    }
    const confirmed = window.confirm(`Inventur "${selectedInventorySession.title}" wirklich abschließen?`);
    if (!confirmed) return;
    try {
      setInventorySaving(true);
      setError("");
      setSuccess("");
      const response = await apiFetch(
        `/inventory-api/inventory-sessions/${selectedInventorySession.id}/complete/`,
        { method: "POST" }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      await loadInventorySessions();
      await loadInventoryCounts(selectedInventorySessionId);
      setSuccess("🏁 Inventur abgeschlossen!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Abschließen der Inventur.";
      setError(message);
    } finally {
      setInventorySaving(false);
    }
  };

  const handleExportInventoryExcel = async () => {
    if (!selectedInventorySessionId) {
      setError("Bitte zuerst eine Inventur auswählen.");
      return;
    }
    try {
      setError("");
      setSuccess("");
      const response = await apiFetch(`/inventory-api/inventory-sessions/${selectedInventorySessionId}/export-excel/`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Fehler beim Excel-Export.");
      }
      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition") || "";
      const filenameMatch = contentDisposition.match(/filename="?([^\"]+)"?/);
      const filename = filenameMatch?.[1] || `inventurbericht-${selectedInventorySessionId}.xlsx`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setSuccess("📤 Inventurbericht erfolgreich exportiert!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Excel-Export.";
      setError(message);
    }
  };

  const exportMovementsToCsv = () => {
    const headers = ["Datum", "Produkt", "Typ", "Menge", "Referenz", "Notiz", "Benutzer"];
    const rows = filteredMovements.map((movement) => [
      new Date(movement.created_at).toLocaleString("de-DE"),
      movement.product_name,
      movement.movement_type === "IN" ? "Wareneingang" : "Warenausgang",
      String(movement.quantity),
      movement.reference_number ?? "",
      movement.note ?? "",
      movement.created_by_username ?? "",
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bewegungshistorie.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!loggedIn) {
    return (
      <div style={pageStyle}>
        <LoginForm onLoginSuccess={() => setLoggedIn(true)} />
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={pageShellStyle}>
        <div style={isCompactLayout ? appLayoutMobileStyle : appLayoutStyle}>
          <aside style={isCompactLayout ? sidebarMobileStyle : sidebarStyle}>
            <div style={sidebarHeaderStyle}>
              <strong>Module</strong>
              <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>ERP-Navigation</span>
            </div>

            {visibleSidebarMenus.map((menu) => {
              const isExpanded = expandedMenus.includes(menu.id);
              return (
                <div key={menu.id} style={sidebarGroupStyle}>
                  <button type="button" onClick={() => toggleMenu(menu.id)} style={sidebarGroupButtonStyle}>
                    <span>{menu.icon} {menu.title}</span>
                    <span>{isExpanded ? "▾" : "▸"}</span>
                  </button>
                  {isExpanded && (
                    <div style={sidebarItemListStyle}>
                      {menu.items.map((item) => (
                        <button
                          key={`${menu.id}-${item.id}`}
                          type="button"
                          onClick={() => selectSection(item.id)}
                          style={activeSection === item.id ? sidebarItemActiveStyle : sidebarItemStyle}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </aside>

          <main style={contentAreaStyle}>
            <header style={headerStyle}>
              <div>
                <p style={eyebrowStyle}>Portfolio Project</p>
                <h1 style={mainTitleStyle}>📦 Smart Inventory Manager</h1>
                <p style={subtitleStyle}>
                  Geschütztes ERP-ähnliches Dashboard mit JWT-Login, Lagerprozessen, Inventur und Rollenmodell.
                </p>
                <p style={{ marginTop: "8px", color: "#94a3b8" }}>
                  Eingeloggt als: <strong>{user?.username}</strong> | Rolle: <strong>{role}</strong>
                </p>
                {role === "viewer" && <p style={infoStyle}>🔒 Viewer-Modus aktiv: Bearbeiten und Buchungen sind deaktiviert.</p>}
                {role === "lager" && <p style={infoStyle}>📦 Lager-Modus aktiv: Du kannst Wareneingang, Warenausgang und Inventur buchen.</p>}
                {role === "admin" && <p style={infoStyle}>⚙️ Admin-Modus aktiv: Du hast vollen Zugriff auf alle Funktionen.</p>}
              </div>
              <button onClick={handleLogout} style={secondaryButtonStyle}>Logout</button>
            </header>

            <section style={topStatsGridStyle}>
              <Card title="Produkte gesamt" value={String(totalProducts)} />
              <Card title="Bestand gesamt" value={String(totalUnits)} />
              <Card title="Niedriger Bestand" value={String(lowStockProducts.length)} danger={lowStockProducts.length > 0} />
              <Card title="Inventur-Differenzen" value={String(inventorySummary.differences)} danger={inventorySummary.differences > 0} />
            </section>

            {error && <p style={errorStyle}>Fehler: {error}</p>}
            {success && <p style={successStyle}>{success}</p>}

            {activeSection === "dashboard" && (
              <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>📊 Dashboard Übersicht</h2>
                <p style={infoStyle}>Zentrale Übersicht über Lagerbestände, kritische Artikel, Tagesbewegungen und Inventurstatus.</p>
                <div style={dashboardGridStyle}>
                  <Card title="Produkte gesamt" value={String(totalProducts)} />
                  <Card title="Bestand gesamt" value={String(totalUnits)} />
                  <Card title="Niedriger Bestand" value={String(lowStockProducts.length)} danger={lowStockProducts.length > 0} />
                  <Card title="Inventur-Differenzen" value={String(inventorySummary.differences)} danger={inventorySummary.differences > 0} />
                  <Card title="Wareneingänge heute" value={String(goodsInToday)} />
                  <Card title="Warenausgänge heute" value={String(goodsOutToday)} />
                </div>
                <div style={{ marginTop: "22px" }}>
                  <h3 style={{ color: "#bfdbfe", marginBottom: "10px", textAlign: "center" }}>Letzte Lagerbewegung</h3>
                  {latestMovement ? (
                    <div style={infoStyle}>
                      <strong>{latestMovement.product_name}</strong><br />
                      Typ: <strong>{latestMovement.movement_type === "IN" ? "Wareneingang" : "Warenausgang"}</strong><br />
                      Menge: <strong>{latestMovement.quantity}</strong><br />
                      Datum: <strong>{new Date(latestMovement.created_at).toLocaleString("de-DE")}</strong>
                    </div>
                  ) : (
                    <p style={infoStyle}>Noch keine Lagerbewegungen vorhanden.</p>
                  )}
                </div>
              </section>
            )}

            {activeSection === "orders" && (
            <OrdersSection
            drafts={purchaseOrderDrafts}
            onRemoveDraft={handleApprovePurchaseOrderDraft}
            onApproveDraft={handleApprovePurchaseOrderDraft}
             />
            )}
            {activeSection === "suppliers" && <PlaceholderSection title="🚚 Lieferanten" text="Hier können später Lieferantenstammdaten, Ansprechpartner und Lieferbedingungen gepflegt werden." />}
            {activeSection === "reorder" && (
              <ReorderSection
                suggestions={reorderSuggestions}
                draftedProductIds={draftedProductIds}
                onCreateOrderDraft={handleCreatePurchaseOrderDraft}
              />
            )}
            {activeSection === "corrections" && <PlaceholderSection title="🔧 Lagerkorrekturen" text="Hier können später manuelle Lagerkorrekturen mit Begründung und Audit-Log gebucht werden." />}
            {activeSection === "locations" && <PlaceholderSection title="📍 Lagerorte" text="Hier können später Lagerorte, Regale und Fächer verwaltet werden." />}
            {activeSection === "customers" && <PlaceholderSection title="👥 Kundenliste" text="Hier kann später ein Kundenstamm mit Kundendaten, Kundennummern und Status entstehen." />}
            {activeSection === "contacts" && <PlaceholderSection title="☎️ Ansprechpartner" text="Hier können später Ansprechpartner je Kunde verwaltet werden." />}
            {activeSection === "addresses" && <PlaceholderSection title="📦 Lieferadressen" text="Hier können später abweichende Lieferadressen je Kunde gepflegt werden." />}
            {activeSection === "customer-notes" && <PlaceholderSection title="📝 Kundennotizen" text="Hier können später Notizen, Hinweise und interne Kundeninformationen gepflegt werden." />}
            {activeSection === "admin-users" && <PlaceholderSection title="👤 Benutzer anlegen" text="Hier kann später eine Benutzerverwaltung im Frontend entstehen. Aktuell erfolgt dies über Django Admin." />}
            {activeSection === "admin-rights" && <PlaceholderSection title="🔐 Rollen & Zugriffsrechte" text="Hier können später Modulrechte für Einkauf, Dispo, Lager und Kundenstamm gepflegt werden." />}
            {activeSection === "admin-locations" && <PlaceholderSection title="📍 Lagerorte anlegen" text="Hier können später neue Lagerorte, Regale und Fächer administriert werden." />}
            {activeSection === "admin-audit" && <PlaceholderSection title="🧾 Systemprotokoll" text="Hier kann später nachvollzogen werden, welcher Benutzer welche Änderung durchgeführt hat." />}

            {activeSection === "product" && (
              <ProductFormSection
                form={form}
                editingId={editingId}
                saving={saving}
                hasPermission={hasPermission}
                handleSubmit={handleSubmit}
                handleChange={handleChange}
                setForm={setForm}
                productNameRef={productNameRef}
                productSkuRef={productSkuRef}
                productQuantityRef={productQuantityRef}
                productMinStockRef={productMinStockRef}
                productUnitRef={productUnitRef}
                productDescriptionRef={productDescriptionRef}
                focusNextOnEnter={focusNextOnEnter}
              />
            )}

            {activeSection === "goods-in" && (
              <GoodsInSection
                products={products}
                movementProductId={movementProductId}
                setMovementProductId={setMovementProductId}
                movementQuantity={movementQuantity}
                setMovementQuantity={setMovementQuantity}
                movementReferenceNumber={movementReferenceNumber}
                setMovementReferenceNumber={setMovementReferenceNumber}
                movementNote={movementNote}
                setMovementNote={setMovementNote}
                movementSaving={movementSaving}
                hasPermission={hasPermission}
                handleGoodsReceipt={handleGoodsReceipt}
                goodsInProductRef={goodsInProductRef}
                goodsInQuantityRef={goodsInQuantityRef}
                focusNextOnEnter={focusNextOnEnter}
              />
            )}

            {activeSection === "goods-out" && (
              <GoodsOutSection
                products={products}
                goodsOutProductId={goodsOutProductId}
                setGoodsOutProductId={setGoodsOutProductId}
                goodsOutQuantity={goodsOutQuantity}
                setGoodsOutQuantity={setGoodsOutQuantity}
                goodsOutReferenceNumber={goodsOutReferenceNumber}
                setGoodsOutReferenceNumber={setGoodsOutReferenceNumber}
                goodsOutNote={goodsOutNote}
                setGoodsOutNote={setGoodsOutNote}
                goodsOutSaving={goodsOutSaving}
                hasPermission={hasPermission}
                handleGoodsIssue={handleGoodsIssue}
                goodsOutProductRef={goodsOutProductRef}
                goodsOutQuantityRef={goodsOutQuantityRef}
                focusNextOnEnter={focusNextOnEnter}
              />
            )}

            {activeSection === "inventory" && (
              <InventorySection
                inventorySummary={inventorySummary}
                inventoryTitle={inventoryTitle}
                setInventoryTitle={setInventoryTitle}
                inventoryNote={inventoryNote}
                setInventoryNote={setInventoryNote}
                inventorySaving={inventorySaving}
                hasPermission={hasPermission}
                handleCreateInventorySession={handleCreateInventorySession}
                selectedInventorySessionId={selectedInventorySessionId}
                setSelectedInventorySessionId={setSelectedInventorySessionId}
                inventorySessions={inventorySessions}
                loadInventoryCounts={loadInventoryCounts}
                selectedInventorySession={selectedInventorySession}
                handleCompleteInventorySession={handleCompleteInventorySession}
                handleExportInventoryExcel={handleExportInventoryExcel}
                inventoryProductId={inventoryProductId}
                setInventoryProductId={setInventoryProductId}
                inventoryProductRef={inventoryProductRef}
                inventoryCountedQuantityRef={inventoryCountedQuantityRef}
                focusNextOnEnter={focusNextOnEnter}
                products={products}
                countedProductIds={countedProductIds}
                inventoryCountedQuantity={inventoryCountedQuantity}
                setInventoryCountedQuantity={setInventoryCountedQuantity}
                inventoryCountNote={inventoryCountNote}
                setInventoryCountNote={setInventoryCountNote}
                handleAddInventoryCount={handleAddInventoryCount}
                selectedInventoryProduct={selectedInventoryProduct}
                inventoryLoading={inventoryLoading}
                inventoryCounts={inventoryCounts}
                inventoryCorrectionSavingId={inventoryCorrectionSavingId}
                handleApplyInventoryCorrection={handleApplyInventoryCorrection}
              />
            )}

            {canShowProductOverview && (
              <>
                <section style={sectionStyle}>
                  <h2 style={sectionTitleStyle}>{activeSection === "min-stock" ? "⚠️ Mindestbestände" : "Bestandsübersicht"}</h2>
                  <div style={filterGridStyle}>
                    <input
                      type="text"
                      placeholder="Suche nach Name, SKU oder Beschreibung"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      style={inputStyle}
                    />
                    <label style={checkboxLabelStyle}>
                      <input
                        type="checkbox"
                        checked={showLowStockOnly || activeSection === "min-stock"}
                        onChange={(event) => setShowLowStockOnly(event.target.checked)}
                        disabled={activeSection === "min-stock"}
                      />
                      Nur niedriger Lagerbestand
                    </label>
                  </div>
                </section>

                {loading && <p>Lade Produkte...</p>}
                {!loading && !error && visibleProducts.length === 0 && <p>Keine Produkte passen zur aktuellen Suche oder zum Filter.</p>}
                {!loading && !error && visibleProducts.length > 0 && (
                  <ProductGrid products={visibleProducts} hasPermission={hasPermission} handleEdit={handleEdit} />
                )}
              </>
            )}

            {activeSection === "history" && (
              <HistorySection
                movementsLoading={movementsLoading}
                filteredMovements={filteredMovements}
                movementSearch={movementSearch}
                setMovementSearch={setMovementSearch}
                movementTypeFilter={movementTypeFilter}
                setMovementTypeFilter={setMovementTypeFilter}
                movementProductFilter={movementProductFilter}
                setMovementProductFilter={setMovementProductFilter}
                products={products}
                exportMovementsToCsv={exportMovementsToCsv}
                hasPermission={hasPermission}
                handleUndoMovement={handleUndoMovement}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function OrdersSection({
  drafts,
  onRemoveDraft,
  onApproveDraft,
}: {
  drafts: PurchaseOrderDraft[];
  onRemoveDraft: (draftId: number) => void;
  onApproveDraft: (draftId: number) => void;
}) {
  const totalQuantity = drafts.reduce((sum, draft) => sum + draft.quantity, 0);

  const approvedCount = drafts.filter(
    (draft) => draft.status === "APPROVED"
  ).length;

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>🛒 Bestellungen</h2>

      <p style={infoStyle}>
        Vorbereitete Bestellentwürfe aus den Nachbestellvorschlägen. Entwürfe
        können im Einkauf freigegeben werden und erhalten anschließend eine
        automatische Bestellnummer.
      </p>

      <div style={dashboardGridStyle}>
        <Card title="Bestellungen gesamt" value={String(drafts.length)} />
        <Card title="Freigegeben" value={String(approvedCount)} />
        <Card title="Gesamtmenge" value={String(totalQuantity)} />
      </div>

      {drafts.length === 0 ? (
        <p style={successStyle}>
          ✅ Aktuell sind keine Bestellentwürfe vorhanden. Über Dispo →
          Nachbestellvorschläge kannst du neue Entwürfe vorbereiten.
        </p>
      ) : (
        <div style={{ ...tableWrapStyle, marginTop: "22px" }}>
          <table style={dataTableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={tableHeadStyle}>Bestellnummer</th>
                <th style={tableHeadStyle}>Produkt</th>
                <th style={tableHeadStyle}>SKU</th>
                <th style={tableHeadStyle}>Menge</th>
                <th style={tableHeadStyle}>Einheit</th>
                <th style={tableHeadStyle}>Status</th>
                <th style={tableHeadStyle}>Erstellt am</th>
                <th style={tableHeadStyle}>Freigegeben am</th>
                <th style={tableHeadStyle}>Aktion</th>
              </tr>
            </thead>

            <tbody>
              {drafts.map((draft) => {
                const isApproved = draft.status === "APPROVED";

                return (
                  <tr
                    key={draft.id}
                    style={{
                      borderTop: "1px solid rgba(148, 163, 184, 0.12)",
                      background: isApproved
                        ? "rgba(22,101,52,0.08)"
                        : "rgba(30, 41, 59, 0.35)",
                    }}
                  >
                    <td style={tableCellStyle}>
                      {draft.orderNumber ?? "—"}
                    </td>

                    <td style={tableCellStyle}>{draft.productName}</td>

                    <td style={tableCellStyle}>{draft.sku}</td>

                    <td style={tableCellStyle}>{draft.quantity}</td>

                    <td style={tableCellStyle}>{draft.unit}</td>

                    <td style={tableCellStyle}>
                      {isApproved ? "✅ Freigegeben" : "📝 Entwurf"}
                    </td>

                    <td style={tableCellStyle}>
                      {new Date(draft.createdAt).toLocaleString("de-DE")}
                    </td>

                    <td style={tableCellStyle}>
                      {draft.approvedAt
                        ? new Date(draft.approvedAt).toLocaleString("de-DE")
                        : "—"}
                    </td>

                    <td style={tableCellStyle}>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => onApproveDraft(draft.id)}
                          disabled={isApproved}
                          style={
                            isApproved
                              ? disabledButtonStyle
                              : primaryButtonStyle
                          }
                        >
                          {isApproved ? "Freigegeben" : "Freigeben"}
                        </button>

                        <button
                          type="button"
                          onClick={() => onRemoveDraft(draft.id)}
                          style={secondaryButtonStyle}
                        >
                          Entfernen
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ReorderSection({
  suggestions,
  draftedProductIds,
  onCreateOrderDraft,
}: {
  suggestions: ReorderSuggestion[];
  draftedProductIds: Set<number>;
  onCreateOrderDraft: (product: ReorderSuggestion) => void;
}) {
  const totalSuggestedQuantity = suggestions.reduce(
    (sum, product) => sum + product.suggestedQuantity,
    0
  );

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>📋 Nachbestellvorschläge</h2>

      <p style={infoStyle}>
        Automatische Vorschläge auf Basis von Mindestbeständen. Produkte mit
        Bestand kleiner oder gleich Mindestbestand werden hier als Nachbestellung
        angezeigt.
      </p>

      <div style={dashboardGridStyle}>
        <Card
          title="Artikel zur Nachbestellung"
          value={String(suggestions.length)}
          danger={suggestions.length > 0}
        />
        <Card
          title="Vorgeschlagene Gesamtmenge"
          value={String(totalSuggestedQuantity)}
          danger={suggestions.length > 0}
        />
      </div>

      {suggestions.length === 0 ? (
        <p style={successStyle}>
          ✅ Aktuell gibt es keine Nachbestellvorschläge. Alle Bestände liegen
          über dem Mindestbestand.
        </p>
      ) : (
        <div style={{ ...tableWrapStyle, marginTop: "22px" }}>
          <table style={dataTableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={tableHeadStyle}>Produkt</th>
                <th style={tableHeadStyle}>SKU</th>
                <th style={tableHeadStyle}>Aktueller Bestand</th>
                <th style={tableHeadStyle}>Mindestbestand</th>
                <th style={tableHeadStyle}>Zielbestand</th>
                <th style={tableHeadStyle}>Vorschlag</th>
                <th style={tableHeadStyle}>Einheit</th>
                <th style={tableHeadStyle}>Status</th>
                <th style={tableHeadStyle}>Aktion</th>
              </tr>
            </thead>

            <tbody>
              {suggestions.map((product) => {
                const isSentToPurchasing = draftedProductIds.has(product.id);

                return (
                  <tr
                    key={product.id}
                    style={{
                      borderTop: "1px solid rgba(148, 163, 184, 0.12)",
                      background: isSentToPurchasing
                        ? "rgba(22,101,52,0.08)"
                        : "rgba(127,29,29,0.08)",
                    }}
                  >
                    <td style={tableCellStyle}>{product.name}</td>
                    <td style={tableCellStyle}>{product.sku}</td>
                    <td style={tableCellStyle}>
                      {product.quantity} {product.unit}
                    </td>
                    <td style={tableCellStyle}>
                      {product.min_stock} {product.unit}
                    </td>
                    <td style={tableCellStyle}>
                      {product.targetStock} {product.unit}
                    </td>
                    <td
                      style={{
                        ...tableCellStyle,
                        color: "#e76262",
                        fontWeight: 700,
                      }}
                    >
                      +{product.suggestedQuantity} {product.unit}
                    </td>
                    <td style={tableCellStyle}>{product.unit}</td>
                    <td style={tableCellStyle}>
                      {isSentToPurchasing
                        ? "📨 An Einkauf gesendet"
                        : "⚠️ Nachbestellen"}
                    </td>
                    <td style={tableCellStyle}>
                      <button
                        type="button"
                        onClick={() => onCreateOrderDraft(product)}
                        disabled={isSentToPurchasing}
                        style={
                          isSentToPurchasing
                            ? disabledButtonStyle
                            : secondaryButtonStyle
                        }
                      >
                        {isSentToPurchasing
                          ? "An Einkauf gesendet"
                          : "Bestellung vorbereiten"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PlaceholderSection({ title, text }: { title: string; text: string }) {
  return (
    <section style={sectionStyle}>
      <div style={placeholderHeaderStyle}>
        <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>{title}</h2>
        <span style={placeholderBadgeStyle}>Modul vorbereitet</span>
      </div>
      <p style={infoStyle}>{text}</p>
      <div style={placeholderBoxStyle}>
        <strong>Geplanter Ausbau</strong>
        <p style={{ marginTop: "8px", color: "#cbd5e1" }}>
          Dieser Bereich ist bereits in der ERP-Navigation vorbereitet und kann später mit eigenen
          Datenmodellen, Formularen, Tabellen, Rollenrechten und Exportfunktionen erweitert werden.
        </p>
      </div>
    </section>
  );
}

function ProductFormSection({
  form,
  editingId,
  saving,
  hasPermission,
  handleSubmit,
  handleChange,
  setForm,
  productNameRef,
  productSkuRef,
  productQuantityRef,
  productMinStockRef,
  productUnitRef,
  productDescriptionRef,
  focusNextOnEnter,
}: {
  form: ProductForm;
  editingId: number | null;
  saving: boolean;
  hasPermission: (required: PermissionRole) => boolean;
  handleSubmit: (event: FormEvent) => void;
  handleChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setForm: Dispatch<SetStateAction<ProductForm>>;
  productNameRef: RefObject<HTMLInputElement | null>;
  productSkuRef: RefObject<HTMLInputElement | null>;
  productQuantityRef: RefObject<HTMLInputElement | null>;
  productMinStockRef: RefObject<HTMLInputElement | null>;
  productUnitRef: RefObject<HTMLSelectElement | null>;
  productDescriptionRef: RefObject<HTMLTextAreaElement | null>;
  focusNextOnEnter: (
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    next?: HTMLElement | null
  ) => void;
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>Produkte / Artikelstamm</h2>
      <form onSubmit={handleSubmit} style={formGridStyle}>
        <input ref={productNameRef} name="name" placeholder="Produktname" value={form.name} onChange={handleChange} onKeyDown={(event) => focusNextOnEnter(event, productSkuRef.current)} style={inputStyle} disabled={!hasPermission("admin")} />
        <input ref={productSkuRef} name="sku" placeholder="SKU" value={form.sku} onChange={handleChange} onKeyDown={(event) => focusNextOnEnter(event, productQuantityRef.current)} style={inputStyle} disabled={!hasPermission("admin")} />
        <input ref={productQuantityRef} name="quantity" type="number" placeholder="Bestand" value={form.quantity} onChange={handleChange} onKeyDown={(event) => focusNextOnEnter(event, productMinStockRef.current)} min="0" style={inputStyle} disabled={!hasPermission("admin")} />
        <input ref={productMinStockRef} name="min_stock" type="number" placeholder="Mindestbestand" value={form.min_stock} onChange={handleChange} onKeyDown={(event) => focusNextOnEnter(event, productUnitRef.current)} min="0" style={inputStyle} disabled={!hasPermission("admin")} />
        <select ref={productUnitRef} value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} onKeyDown={(event) => focusNextOnEnter(event, productDescriptionRef.current)} style={inputStyle} disabled={!hasPermission("admin")}>
          {unitOptions.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
        </select>
        <textarea ref={productDescriptionRef} name="description" placeholder="Beschreibung" value={form.description} onChange={handleChange} style={{ ...inputStyle, minHeight: "100px", gridColumn: "1 / -1" }} disabled={!hasPermission("admin")} />
        <button type="submit" disabled={saving || !hasPermission("admin")} style={hasPermission("admin") ? { ...primaryButtonStyle, gridColumn: "1 / -1" } : { ...primaryButtonStyle, gridColumn: "1 / -1", opacity: 0.4, cursor: "not-allowed" }}>
          {saving ? "Speichere..." : editingId ? "Produkt aktualisieren" : "Produkt speichern"}
        </button>
      </form>
    </section>
  );
}

function GoodsInSection({
  products,
  movementProductId,
  setMovementProductId,
  movementQuantity,
  setMovementQuantity,
  movementReferenceNumber,
  setMovementReferenceNumber,
  movementNote,
  setMovementNote,
  movementSaving,
  hasPermission,
  handleGoodsReceipt,
  goodsInProductRef,
  goodsInQuantityRef,
  focusNextOnEnter,
}: {
  products: Product[];
  movementProductId: string;
  setMovementProductId: (value: string) => void;
  movementQuantity: string;
  setMovementQuantity: (value: string) => void;
  movementReferenceNumber: string;
  setMovementReferenceNumber: (value: string) => void;
  movementNote: string;
  setMovementNote: (value: string) => void;
  movementSaving: boolean;
  hasPermission: (required: PermissionRole) => boolean;
  handleGoodsReceipt: (event: FormEvent) => void;
  goodsInProductRef: RefObject<HTMLSelectElement | null>;
  goodsInQuantityRef: RefObject<HTMLInputElement | null>;
  focusNextOnEnter: (
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    next?: HTMLElement | null
  ) => void;
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>📥 Wareneingang buchen</h2>
      <form onSubmit={handleGoodsReceipt} style={formGridStyle}>
        <select ref={goodsInProductRef} value={movementProductId} onChange={(event) => setMovementProductId(event.target.value)} onKeyDown={(event) => focusNextOnEnter(event, goodsInQuantityRef.current)} required style={inputStyle} disabled={!hasPermission("lager")}>
          <option value="">Produkt auswählen</option>
          {products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}
        </select>
        <input ref={goodsInQuantityRef} type="number" placeholder="Menge" value={movementQuantity} onChange={(event) => setMovementQuantity(event.target.value)} required min="1" style={inputStyle} disabled={!hasPermission("lager")} />
        <input type="text" placeholder="Lieferschein / Referenznummer" value={movementReferenceNumber} onChange={(event) => setMovementReferenceNumber(event.target.value)} style={inputStyle} disabled={!hasPermission("lager")} />
        <textarea placeholder="Notiz" value={movementNote} onChange={(event) => setMovementNote(event.target.value)} style={{ ...inputStyle, minHeight: "48px", gridColumn: "1 / -1" }} disabled={!hasPermission("lager")} />
        <div style={{ gridColumn: "1 / -1" }}>
          <button type="submit" disabled={movementSaving || !hasPermission("lager")} style={hasPermission("lager") ? primaryButtonStyle : disabledButtonStyle}>
            {movementSaving ? "Buche..." : "Wareneingang buchen"}
          </button>
        </div>
      </form>
    </section>
  );
}

function GoodsOutSection({
  products,
  goodsOutProductId,
  setGoodsOutProductId,
  goodsOutQuantity,
  setGoodsOutQuantity,
  goodsOutReferenceNumber,
  setGoodsOutReferenceNumber,
  goodsOutNote,
  setGoodsOutNote,
  goodsOutSaving,
  hasPermission,
  handleGoodsIssue,
  goodsOutProductRef,
  goodsOutQuantityRef,
  focusNextOnEnter,
}: {
  products: Product[];
  goodsOutProductId: string;
  setGoodsOutProductId: (value: string) => void;
  goodsOutQuantity: string;
  setGoodsOutQuantity: (value: string) => void;
  goodsOutReferenceNumber: string;
  setGoodsOutReferenceNumber: (value: string) => void;
  goodsOutNote: string;
  setGoodsOutNote: (value: string) => void;
  goodsOutSaving: boolean;
  hasPermission: (required: PermissionRole) => boolean;
  handleGoodsIssue: (event: FormEvent) => void;
  goodsOutProductRef: RefObject<HTMLSelectElement | null>;
  goodsOutQuantityRef: RefObject<HTMLInputElement | null>;
  focusNextOnEnter: (
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    next?: HTMLElement | null
  ) => void;
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>📤 Warenausgang buchen</h2>
      <form onSubmit={handleGoodsIssue} style={formGridStyle}>
        <select ref={goodsOutProductRef} value={goodsOutProductId} onChange={(event) => setGoodsOutProductId(event.target.value)} onKeyDown={(event) => focusNextOnEnter(event, goodsOutQuantityRef.current)} required style={inputStyle} disabled={!hasPermission("lager")}>
          <option value="">Produkt auswählen</option>
          {products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}
        </select>
        <input ref={goodsOutQuantityRef} type="number" placeholder="Menge" value={goodsOutQuantity} onChange={(event) => setGoodsOutQuantity(event.target.value)} required min="1" style={inputStyle} disabled={!hasPermission("lager")} />
        <input type="text" placeholder="Referenznummer" value={goodsOutReferenceNumber} onChange={(event) => setGoodsOutReferenceNumber(event.target.value)} style={inputStyle} disabled={!hasPermission("lager")} />
        <textarea placeholder="Notiz" value={goodsOutNote} onChange={(event) => setGoodsOutNote(event.target.value)} style={{ ...inputStyle, minHeight: "48px", gridColumn: "1 / -1" }} disabled={!hasPermission("lager")} />
        <div style={{ gridColumn: "1 / -1" }}>
          <button type="submit" disabled={goodsOutSaving || !hasPermission("lager")} style={hasPermission("lager") ? primaryButtonStyle : disabledButtonStyle}>
            {goodsOutSaving ? "Buche..." : "Warenausgang buchen"}
          </button>
        </div>
      </form>
    </section>
  );
}

function InventorySection({
  inventorySummary,
  inventoryTitle,
  setInventoryTitle,
  inventoryNote,
  setInventoryNote,
  inventorySaving,
  hasPermission,
  handleCreateInventorySession,
  selectedInventorySessionId,
  setSelectedInventorySessionId,
  inventorySessions,
  loadInventoryCounts,
  selectedInventorySession,
  handleCompleteInventorySession,
  handleExportInventoryExcel,
  inventoryProductId,
  setInventoryProductId,
  inventoryProductRef,
  inventoryCountedQuantityRef,
  focusNextOnEnter,
  products,
  countedProductIds,
  inventoryCountedQuantity,
  setInventoryCountedQuantity,
  inventoryCountNote,
  setInventoryCountNote,
  handleAddInventoryCount,
  selectedInventoryProduct,
  inventoryLoading,
  inventoryCounts,
  inventoryCorrectionSavingId,
  handleApplyInventoryCorrection,
}: {
  inventorySummary: InventorySummary;
  inventoryTitle: string;
  setInventoryTitle: (value: string) => void;
  inventoryNote: string;
  setInventoryNote: (value: string) => void;
  inventorySaving: boolean;
  hasPermission: (required: PermissionRole) => boolean;
  handleCreateInventorySession: (event: FormEvent) => void;
  selectedInventorySessionId: string;
  setSelectedInventorySessionId: (value: string) => void;
  inventorySessions: InventorySession[];
  loadInventoryCounts: (sessionId?: string) => Promise<void>;
  selectedInventorySession: InventorySession | null;
  handleCompleteInventorySession: () => Promise<void>;
  handleExportInventoryExcel: () => Promise<void>;
  inventoryProductId: string;
  setInventoryProductId: (value: string) => void;
  inventoryProductRef: RefObject<HTMLSelectElement | null>;
  inventoryCountedQuantityRef: RefObject<HTMLInputElement | null>;
  focusNextOnEnter: (
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    next?: HTMLElement | null
  ) => void;
  products: Product[];
  countedProductIds: Set<number>;
  inventoryCountedQuantity: string;
  setInventoryCountedQuantity: (value: string) => void;
  inventoryCountNote: string;
  setInventoryCountNote: (value: string) => void;
  handleAddInventoryCount: (event: FormEvent) => void;
  selectedInventoryProduct: Product | null;
  inventoryLoading: boolean;
  inventoryCounts: InventoryCount[];
  inventoryCorrectionSavingId: number | null;
  handleApplyInventoryCorrection: (count: InventoryCount) => void;
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>🧾 Inventur-Modus</h2>
      <div style={dashboardGridStyle}>
        <Card title="Positionen" value={String(inventorySummary.total)} />
        <Card title="Gezählt" value={String(inventorySummary.done)} />
        <Card title="Differenzen" value={String(inventorySummary.differences)} danger={inventorySummary.differences > 0} />
        <Card title="Korrigiert" value={String(inventorySummary.corrected)} />
      </div>
      <form onSubmit={handleCreateInventorySession} style={{ ...formGridStyle, marginTop: "22px", marginBottom: "24px" }}>
        <input type="text" placeholder="Titel der Inventur" value={inventoryTitle} onChange={(event) => setInventoryTitle(event.target.value)} style={inputStyle} disabled={!hasPermission("lager")} />
        <input type="text" placeholder="Notiz zur Inventur" value={inventoryNote} onChange={(event) => setInventoryNote(event.target.value)} style={inputStyle} disabled={!hasPermission("lager")} />
        <button type="submit" disabled={inventorySaving || !hasPermission("lager")} style={hasPermission("lager") ? primaryButtonStyle : disabledButtonStyle}>
          {inventorySaving ? "Erstelle..." : "Neue Inventur starten"}
        </button>
      </form>
      <div style={formGridStyle}>
        <select value={selectedInventorySessionId} onChange={(event) => setSelectedInventorySessionId(event.target.value)} style={inputStyle}>
          <option value="">Inventur auswählen</option>
          {inventorySessions.map((session) => (
            <option key={session.id} value={session.id}>#{session.id} {session.title} ({session.status === "OPEN" ? "Offen" : "Abgeschlossen"})</option>
          ))}
        </select>
        <button type="button" onClick={() => void loadInventoryCounts(selectedInventorySessionId)} style={secondaryButtonStyle} disabled={!selectedInventorySessionId}>Inventur laden</button>
        <button type="button" onClick={() => void handleCompleteInventorySession()} style={secondaryButtonStyle} disabled={!selectedInventorySession || selectedInventorySession.status === "COMPLETED" || !hasPermission("lager")}>Inventur abschließen</button>
        <button type="button" onClick={() => void handleExportInventoryExcel()} style={secondaryButtonStyle} disabled={!selectedInventorySessionId}>📤 Excel-Bericht exportieren</button>
      </div>
      {selectedInventorySession && (
        <p style={infoStyle}>Aktive Inventur: <strong>{selectedInventorySession.title}</strong> | Status: <strong>{selectedInventorySession.status === "OPEN" ? "Offen" : "Abgeschlossen"}</strong></p>
      )}
      <form onSubmit={handleAddInventoryCount} style={{ ...formGridStyle, margin: "22px 0" }}>
        <select ref={inventoryProductRef} value={inventoryProductId} onChange={(event) => setInventoryProductId(event.target.value)} onKeyDown={(event) => focusNextOnEnter(event, inventoryCountedQuantityRef.current)} style={inputStyle} disabled={!hasPermission("lager") || !selectedInventorySessionId || selectedInventorySession?.status === "COMPLETED"}>
          <option value="">Produkt auswählen</option>
          {products.filter((product) => !countedProductIds.has(product.id)).map((product) => (
            <option key={product.id} value={product.id}>{product.name} ({product.sku}) - Soll: {product.quantity} {product.unit}</option>
          ))}
        </select>
        <input ref={inventoryCountedQuantityRef} type="number" placeholder="Gezählte Menge" value={inventoryCountedQuantity} onChange={(event) => setInventoryCountedQuantity(event.target.value)} min="0" style={inputStyle} disabled={!hasPermission("lager") || !selectedInventorySessionId || selectedInventorySession?.status === "COMPLETED"} />
        <input type="text" placeholder="Notiz zur Zählung" value={inventoryCountNote} onChange={(event) => setInventoryCountNote(event.target.value)} style={inputStyle} disabled={!hasPermission("lager") || !selectedInventorySessionId || selectedInventorySession?.status === "COMPLETED"} />
        <button type="submit" disabled={inventorySaving || !hasPermission("lager") || !selectedInventorySessionId || selectedInventorySession?.status === "COMPLETED"} style={hasPermission("lager") ? primaryButtonStyle : disabledButtonStyle}>{inventorySaving ? "Speichere..." : "Zählung speichern"}</button>
      </form>
      {selectedInventoryProduct && (
        <p style={{ ...infoStyle, background: "rgba(30, 41, 59, 0.75)" }}>Ausgewähltes Produkt: <strong>{selectedInventoryProduct.name}</strong> | Systembestand: <strong>{selectedInventoryProduct.quantity} {selectedInventoryProduct.unit}</strong></p>
      )}
      {inventoryLoading && <p>Lade Inventur...</p>}
      {!inventoryLoading && inventoryCounts.length > 0 && <InventoryCountTable inventoryCounts={inventoryCounts} selectedInventorySession={selectedInventorySession} inventoryCorrectionSavingId={inventoryCorrectionSavingId} hasPermission={hasPermission} handleApplyInventoryCorrection={handleApplyInventoryCorrection} />}
      {!inventoryLoading && selectedInventorySessionId && inventoryCounts.length === 0 && <p>Noch keine Inventurpositionen vorhanden.</p>}
    </section>
  );
}

function ProductGrid({
  products,
  hasPermission,
  handleEdit,
}: {
  products: Product[];
  hasPermission: (required: PermissionRole) => boolean;
  handleEdit: (product: Product) => void;
}) {
  return (
    <div style={productGridStyle}>
      {products.map((product) => {
        const isLowStock = product.quantity <= product.min_stock;
        return (
          <article key={product.id} style={{ background: isLowStock ? "rgba(127, 29, 29, 0.18)" : "rgba(15, 23, 42, 0.78)", border: isLowStock ? "1px solid rgba(248, 113, 113, 0.35)" : "1px solid rgba(148, 163, 184, 0.18)", borderRadius: "20px", padding: "18px", boxShadow: "0 18px 40px rgba(0,0,0,0.22)" }}>
            <h3 style={{ margin: "0 0 6px 0", color: "#f8fafc" }}>{product.name}</h3>
            <p style={{ margin: "0 0 10px 0", color: "#93c5fd" }}>{product.sku}</p>
            <div style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
              <div>Bestand: {product.quantity} {product.unit}</div>
              <div>Mindestbestand: {product.min_stock}</div>
              {product.description && <div>Beschreibung: {product.description}</div>}
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button type="button" onClick={() => hasPermission("admin") && handleEdit(product)} disabled={!hasPermission("admin")} style={hasPermission("admin") ? secondaryButtonStyle : disabledButtonStyle}>Bearbeiten</button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function InventoryCountTable({
  inventoryCounts,
  selectedInventorySession,
  inventoryCorrectionSavingId,
  hasPermission,
  handleApplyInventoryCorrection,
}: {
  inventoryCounts: InventoryCount[];
  selectedInventorySession: InventorySession | null;
  inventoryCorrectionSavingId: number | null;
  hasPermission: (required: PermissionRole) => boolean;
  handleApplyInventoryCorrection: (count: InventoryCount) => void;
}) {
  return (
    <div style={tableWrapStyle}>
      <table style={dataTableStyle}>
        <thead>
          <tr style={tableHeaderRowStyle}>
            <th style={tableHeadStyle}>Produkt</th><th style={tableHeadStyle}>SKU</th><th style={tableHeadStyle}>Soll</th><th style={tableHeadStyle}>Ist</th><th style={tableHeadStyle}>Differenz</th><th style={tableHeadStyle}>Status</th><th style={tableHeadStyle}>Notiz</th><th style={tableHeadStyle}>Aktion</th>
          </tr>
        </thead>
        <tbody>
          {inventoryCounts.map((count) => {
            const diff = count.difference ?? 0;
            const hasDiff = diff !== 0;
            return (
              <tr key={count.id} style={{ borderTop: "1px solid rgba(148, 163, 184, 0.12)", background: hasDiff ? "rgba(127,29,29,0.09)" : "rgba(22,101,52,0.08)" }}>
                <td style={tableCellStyle}>{count.product_name}</td>
                <td style={tableCellStyle}>{count.product_sku}</td>
                <td style={tableCellStyle}>{count.expected_quantity} {count.product_unit}</td>
                <td style={tableCellStyle}>{count.counted_quantity ?? "—"} {count.product_unit}</td>
                <td style={{ ...tableCellStyle, color: hasDiff ? "#fca5a5" : "#86efac", fontWeight: 700 }}>{count.difference === null ? "—" : count.difference > 0 ? `+${count.difference}` : count.difference}</td>
                <td style={tableCellStyle}>{count.corrected ? "✅ Korrigiert" : hasDiff ? "⚠️ Offen" : "✅ OK"}</td>
                <td style={tableCellStyle}>{count.note || "—"}</td>
                <td style={tableCellStyle}>
                  <button type="button" onClick={() => handleApplyInventoryCorrection(count)} disabled={count.corrected || count.counted_quantity === null || !hasPermission("lager") || selectedInventorySession?.status === "COMPLETED" || inventoryCorrectionSavingId === count.id} style={!count.corrected && count.counted_quantity !== null && hasPermission("lager") ? secondaryButtonStyle : disabledButtonStyle}>
                    {inventoryCorrectionSavingId === count.id ? "Buche..." : count.corrected ? "Erledigt" : "Korrektur buchen"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HistorySection({
  movementsLoading,
  filteredMovements,
  movementSearch,
  setMovementSearch,
  movementTypeFilter,
  setMovementTypeFilter,
  movementProductFilter,
  setMovementProductFilter,
  products,
  exportMovementsToCsv,
  hasPermission,
  handleUndoMovement,
}: {
  movementsLoading: boolean;
  filteredMovements: StockMovement[];
  movementSearch: string;
  setMovementSearch: (value: string) => void;
  movementTypeFilter: "" | "IN" | "OUT";
  setMovementTypeFilter: (value: "" | "IN" | "OUT") => void;
  movementProductFilter: string;
  setMovementProductFilter: (value: string) => void;
  products: Product[];
  exportMovementsToCsv: () => void;
  hasPermission: (required: PermissionRole) => boolean;
  handleUndoMovement: (movement: StockMovement) => void;
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>Bewegungshistorie</h2>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <button type="button" onClick={exportMovementsToCsv} style={secondaryButtonStyle}>CSV exportieren</button>
      </div>
      <div style={filterGridStyle}>
        <input type="text" placeholder="Suche nach Produkt, Referenz oder Notiz" value={movementSearch} onChange={(event) => setMovementSearch(event.target.value)} style={inputStyle} />
        <select value={movementTypeFilter} onChange={(event) => setMovementTypeFilter(event.target.value as "" | "IN" | "OUT")} style={inputStyle}>
          <option value="">Alle Bewegungen</option><option value="IN">Nur Wareneingang</option><option value="OUT">Nur Warenausgang</option>
        </select>
        <select value={movementProductFilter} onChange={(event) => setMovementProductFilter(event.target.value)} style={inputStyle}>
          <option value="">Alle Produkte</option>
          {[...new Set(products.map((product) => product.name))].map((productName) => <option key={productName} value={productName}>{productName}</option>)}
        </select>
      </div>
      {movementsLoading && <p>Lade Bewegungen...</p>}
      {!movementsLoading && filteredMovements.length === 0 && <p>Keine Bewegungen gefunden.</p>}
      {!movementsLoading && filteredMovements.length > 0 && (
        <div style={tableWrapStyle}>
          <table style={dataTableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={tableHeadStyle}>Datum</th><th style={tableHeadStyle}>Produkt</th><th style={tableHeadStyle}>Typ</th><th style={tableHeadStyle}>Menge</th><th style={tableHeadStyle}>Referenz</th><th style={tableHeadStyle}>Notiz</th><th style={tableHeadStyle}>Benutzer</th><th style={tableHeadStyle}>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map((movement, index) => {
                const isIn = movement.movement_type === "IN";
                const isLatest = index === 0;
                return (
                  <tr key={movement.id} style={{ borderTop: "1px solid rgba(148, 163, 184, 0.12)", background: isIn ? "rgba(22,101,52,0.08)" : "rgba(127,29,29,0.08)", transition: "0.2s" }}>
                    <td style={tableCellStyle}>{new Date(movement.created_at).toLocaleString("de-DE")}</td>
                    <td style={tableCellStyle}>{movement.product_name}</td>
                    <td style={tableCellStyle}><span style={{ color: isIn ? "#86efac" : "#fca5a5", fontWeight: 700 }}>{isIn ? "Wareneingang" : "Warenausgang"}</span></td>
                    <td style={tableCellStyle}>{movement.movement_type === "OUT" ? `-${movement.quantity}` : movement.quantity}</td>
                    <td style={{ ...tableCellStyle, color: movement.reference_number ? "#e5e7eb" : "#64748b" }}>{movement.reference_number || "—"}</td>
                    <td style={{ ...tableCellStyle, color: movement.note ? "#e5e7eb" : "#64748b" }}>{movement.note || "—"}</td>
                    <td style={{ ...tableCellStyle, color: movement.created_by_username ? "#e5e7eb" : "#64748b" }}>{movement.created_by_username || "—"}</td>
                    <td style={tableCellStyle}>{isLatest && <button type="button" onClick={() => hasPermission("admin") && handleUndoMovement(movement)} disabled={!hasPermission("admin")} style={hasPermission("admin") ? secondaryButtonStyle : disabledButtonStyle}>Rückgängig</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Card({
  title,
  value,
  danger = false,
}: {
  title: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.8)",
        border: danger
          ? "1px solid rgba(248, 113, 113, 0.25)"
          : "1px solid rgba(148, 163, 184, 0.2)",
        borderRadius: "18px",
        padding: "20px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        minHeight: "96px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          color: danger ? "#fca5a5" : "#94a3b8",
          marginBottom: "8px",
          textAlign: "center",
          fontSize: "0.95rem",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          color: danger ? "#fecaca" : "#f8fafc",
          textAlign: "center",
        }}
      >
        {value}
      </div>
    </div>
  );
}



const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #0f172a 0%, #111827 45%, #0b1120 100%)",
  color: "#e5e7eb",
  padding: "32px 20px",
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const pageShellStyle: CSSProperties = {
  width: "min(1600px, calc(100vw - 32px))",
  margin: "0 auto",
};

const appLayoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1080px minmax(0, 1fr)",
  gap: "28px",
  alignItems: "start",
};

const sidebarStyle: CSSProperties = {
  position: "fixed",
  top: "180px",
  left: "50px",
  width: "300px",
  maxHeight: "calc(100vh - 110px)",
  overflowY: "auto",
  background: "rgba(25, 31, 48, 0.92)",
  border: "1px solid rgba(29, 110, 224, 0.22)",
  borderRadius: "25px",
  padding: "16px",
  boxShadow: "0 16px 40px rgba(12, 52, 184, 0.35)",
  zIndex: 20,
  boxSizing: "border-box",
};

const contentAreaStyle: CSSProperties = {
  minWidth: 0,
  width: "100%",
};

const appLayoutMobileStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "18px",
  alignItems: "start",
};

const sidebarMobileStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  maxHeight: "none",
  overflowY: "visible",
  background: "rgba(15, 23, 42, 0.88)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: "20px",
  padding: "16px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  boxSizing: "border-box",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "28px",
  width: "100%",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 10px 0",
  color: "#93c5fd",
  fontSize: "0.95rem",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const mainTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "2.5rem",
  lineHeight: 1.1,
  color: "#f5f7fa",
};

const subtitleStyle: CSSProperties = {
  marginTop: "12px",
  color: "#cbd5e1",
  maxWidth: "760px",
};

const topStatsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "16px",
  marginBottom: "28px",
  width: "100%",
};

const dashboardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginTop: "20px",
  width: "100%",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
};

const filterGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
  marginBottom: "18px",
  alignItems: "center",
};

const productGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "16px",
};

const checkboxLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#e5e7eb",
  whiteSpace: "nowrap",
};

const sidebarHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "14px",
  color: "#f8fafc",
};

const sidebarGroupStyle: CSSProperties = {
  marginBottom: "10px",
};

const sidebarGroupButtonStyle: CSSProperties = {
  width: "100%",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "12px",
  padding: "11px 12px",
  background: "rgba(30, 41, 59, 0.82)",
  color: "#e5e7eb",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontWeight: 700,
};

const sidebarItemListStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  marginTop: "8px",
  paddingLeft: "10px",
};

const sidebarItemStyle: CSSProperties = {
  border: "none",
  borderRadius: "10px",
  padding: "9px 10px",
  background: "transparent",
  color: "#94a3b8",
  cursor: "pointer",
  textAlign: "left",
};

const sidebarItemActiveStyle: CSSProperties = {
  ...sidebarItemStyle,
  background: "rgba(37, 99, 235, 0.22)",
  color: "#bfdbfe",
  fontWeight: 700,
};

const infoStyle: CSSProperties = {
  marginTop: "10px",
  padding: "10px 12px",
  borderRadius: "10px",
  background: "rgba(59, 130, 246, 0.15)",
  border: "1px solid rgba(96, 165, 250, 0.3)",
  color: "#bfdbfe",
  textAlign: "center",
};

const tableWrapStyle: CSSProperties = {
  overflowX: "auto",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "14px",
};

const dataTableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "900px",
};

const tableHeaderRowStyle: CSSProperties = {
  background: "rgba(30, 41, 59, 0.7)",
  textAlign: "left",
};

const tableHeadStyle: CSSProperties = {
  padding: "12px 14px",
  color: "#ededee",
  fontSize: "0.95rem",
  fontWeight: 700,
};

const tableCellStyle: CSSProperties = {
  padding: "12px 14px",
  color: "#e9ecf3",
  verticalAlign: "top",
};

const sectionStyle: CSSProperties = {
  background: "rgba(15, 23, 42, 0.8)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  marginBottom: "28px",
  width: "100%",
  boxSizing: "border-box",
};

const sectionTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "18px",
  color: "#8cbfd6",
  fontSize: "2rem",
  textAlign: "center",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  background: "rgba(15, 23, 42, 0.72)",
  color: "#f8fafc",
  outline: "none",
  boxSizing: "border-box",
};

const primaryButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: "12px",
  padding: "12px 16px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 600,
};

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "12px",
  padding: "12px 16px",
  background: "rgba(30, 41, 59, 0.85)",
  color: "#e5e7eb",
  cursor: "pointer",
  fontWeight: 600,
};

const disabledButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  opacity: 0.4,
  cursor: "not-allowed",
};

const errorStyle: CSSProperties = {
  color: "#f87474",
  background: "rgba(127, 29, 29, 0.18)",
  border: "1px solid rgba(248, 113, 113, 0.25)",
  borderRadius: "10px",
  padding: "10px 12px",
  marginBottom: "16px",
};

const successStyle: CSSProperties = {
  color: "#86efac",
  background: "rgba(22, 101, 52, 0.18)",
  border: "1px solid rgba(34, 197, 94, 0.25)",
  borderRadius: "10px",
  padding: "10px 12px",
  marginBottom: "16px",
};

const placeholderHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "16px",
};

const placeholderBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "rgba(59, 130, 246, 0.15)",
  border: "1px solid rgba(96, 165, 250, 0.28)",
  color: "#bfdbfe",
  fontSize: "0.85rem",
  fontWeight: 700,
};

const placeholderBoxStyle: CSSProperties = {
  marginTop: "16px",
  padding: "16px",
  borderRadius: "14px",
  background: "rgba(30, 41, 59, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  color: "#e5e7eb",
};

export default App;