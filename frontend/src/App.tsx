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
  weight_kg?: string | number | null;
  removal_strategy?: string;
  putaway_strategy?: string;
  fixed_storage_location?: number | null;
  fixed_storage_location_label?: string | null;

  storage_location?: number | null;
  storage_location_code?: string | null;
  storage_location_name?: string | null;
  storage_location_label?: string | null;

  packaging_type?: number | null;
  packaging_type_name?: string | null;
};

type PackagingType = {
  id: number;
  name: string;
  description: string;
  category: "PACKAGING" | "LOAD_CARRIER";
  unit_cost: string | null;
  is_active: boolean;
  length_cm: string | null;
  width_cm: string | null;
  height_cm: string | null;
  weight_kg: string | null;
};


type StorageLocation = {
  id: number;
  code: string;
  name: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  description: string;

  is_active: boolean;
  is_blocked: boolean;
  is_empty: boolean;
  allow_mixed_products: boolean;

  length_cm: string | null;
  width_cm: string | null;
  height_cm: string | null;
  max_weight_kg: string | null;
  available_weight_kg?: string | number | null;
  available_volume_cm3?: string | number | null;
  occupied_weight_kg?: string | number | null;
  occupied_volume_cm3?: string | number | null;

  product_count: number;
  created_at: string;
  updated_at: string;
};

type StorageLocationStock = {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  product_unit: string;
  storage_location: number;
  storage_location_code: string;
  storage_location_name: string;
  storage_location_label: string;
  quantity: number;
  packaging_type?: number | null;
  packaging_type_name?: string | null;
  load_carrier_type?: number | null;
  load_carrier_type_name?: string | null;
  packaging_quantity?: number;
  unit_purchase_price?: string | null;
  expiry_date?: string | null;
  created_at: string;
  updated_at: string;
};

type StorageLocationForm = {
  code: string;
  name: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  description: string;

  is_active: boolean;
  is_blocked: boolean;
  is_empty: boolean;
  allow_mixed_products: boolean;

  length_cm: string;
  width_cm: string;
  height_cm: string;
  max_weight_kg: string;
};

type Supplier = {
  id: number;
  name: string;
  supplier_number: string | null;
  contact_person: string;
  email: string;
  phone: string;
  street: string;
  postal_code: string;
  city: string;
  country: string;
  note: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type SupplierForm = {
  name: string;
  supplier_number: string;
  contact_person: string;
  email: string;
  phone: string;
  street: string;
  postal_code: string;
  city: string;
  country: string;
  note: string;
  is_active: boolean;
};

type Customer = {
  id: number;
  customer_number: string | null;
  name: string;
  email: string;
  phone: string;
  street: string;
  postal_code: string;
  city: string;
  country: string;
  note: string;
  is_active: boolean;
  contact_count: number;
  delivery_address_count: number;
  note_count: number;
  created_at: string;
  updated_at: string;
};

type CustomerForm = {
  customer_number: string;
  name: string;
  email: string;
  phone: string;
  street: string;
  postal_code: string;
  city: string;
  country: string;
  note: string;
  is_active: boolean;
};

type CustomerContact = {
  id: number;
  customer: number;
  customer_name: string;
  first_name: string;
  last_name: string;
  role: string;
  email: string;
  phone: string;
  mobile: string;
  is_primary: boolean;
  is_active: boolean;
  note: string;
  created_at: string;
  updated_at: string;
};

type CustomerContactForm = {
  customer: string;
  first_name: string;
  last_name: string;
  role: string;
  email: string;
  phone: string;
  mobile: string;
  is_primary: boolean;
  is_active: boolean;
  note: string;
};

type DeliveryAddress = {
  id: number;
  customer: number;
  customer_name: string;
  label: string;
  recipient_name: string;
  street: string;
  postal_code: string;
  city: string;
  country: string;
  is_default: boolean;
  is_active: boolean;
  note: string;
  created_at: string;
  updated_at: string;
};

type DeliveryAddressForm = {
  customer: string;
  label: string;
  recipient_name: string;
  street: string;
  postal_code: string;
  city: string;
  country: string;
  is_default: boolean;
  is_active: boolean;
  note: string;
};

type CustomerNote = {
  id: number;
  customer: number;
  customer_name: string;
  title: string;
  note: string;
  created_by?: number | null;
  created_by_username?: string | null;
  created_at: string;
  updated_at: string;
};

type CustomerNoteForm = {
  customer: string;
  title: string;
  note: string;
};

 type StockMovement = {
  id: number;
  product: number;
  product_name: string;
  movement_type: "IN" | "OUT";
  quantity: number;

  storage_location?: number | null;
  storage_location_label?: string | null;

  packaging_type?: number | null;
  packaging_type_name?: string | null;

  load_carrier_type?: number | null;
  load_carrier_type_name?: string | null;

  packaging_quantity?: number;
  packaging_cost_total?: string | null;
  unit_purchase_price?: string | null;
  expiry_date?: string | null;

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
  weight_kg: string;
  removal_strategy: string;
  putaway_strategy: string;
  fixed_storage_location: string;
  storage_location: string;
  packaging_type: string;
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

type AdminUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  role: string;
};

type AdminUserForm = {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
};

type AuditLog = {
  id: number;
  area: string;
  action: string;
  object_type: string;
  object_id: string;
  message: string;
  metadata: Record<string, unknown>;
  created_by?: number | null;
  created_by_username?: string | null;
  created_at: string;
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
  weight_kg: "",
  removal_strategy: "FIFO",
  putaway_strategy: "EMPTY_BIN",
  fixed_storage_location: "",
  storage_location: "",
  packaging_type: "",
};

const initialStorageLocationForm: StorageLocationForm = {
  code: "",
  name: "",
  zone: "",
  aisle: "",
  rack: "",
  shelf: "",
  description: "",

  is_active: true,
  is_blocked: false,
  is_empty: true,
  allow_mixed_products: false,

  length_cm: "",
  width_cm: "",
  height_cm: "",
  max_weight_kg: "",
};


const initialSupplierForm: SupplierForm = {
  name: "",
  supplier_number: "",
  contact_person: "",
  email: "",
  phone: "",
  street: "",
  postal_code: "",
  city: "",
  country: "Deutschland",
  note: "",
  is_active: true,
};

const initialCustomerForm: CustomerForm = {
  customer_number: "",
  name: "",
  email: "",
  phone: "",
  street: "",
  postal_code: "",
  city: "",
  country: "Deutschland",
  note: "",
  is_active: true,
};

const initialCustomerContactForm: CustomerContactForm = {
  customer: "",
  first_name: "",
  last_name: "",
  role: "",
  email: "",
  phone: "",
  mobile: "",
  is_primary: false,
  is_active: true,
  note: "",
};

const initialDeliveryAddressForm: DeliveryAddressForm = {
  customer: "",
  label: "Standard",
  recipient_name: "",
  street: "",
  postal_code: "",
  city: "",
  country: "Deutschland",
  is_default: false,
  is_active: true,
  note: "",
};

const initialCustomerNoteForm: CustomerNoteForm = {
  customer: "",
  title: "",
  note: "",
};

const initialAdminUserForm: AdminUserForm = {
  username: "",
  password: "",
  email: "",
  first_name: "",
  last_name: "",
  role: "viewer",
  is_active: true,
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
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

useEffect(() => {
  const updateLayout = () => {
    setWindowWidth(window.innerWidth);
  };

  updateLayout();
  window.addEventListener("resize", updateLayout);

  return () => window.removeEventListener("resize", updateLayout);
}, []);

const isMobileLayout = windowWidth < 760;
const isCompactLayout = windowWidth < 1180;

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

    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [adminUserSaving, setAdminUserSaving] = useState(false);
  const [adminUserForm, setAdminUserForm] =
    useState<AdminUserForm>(initialAdminUserForm);

const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementProductFilter, setMovementProductFilter] = useState("");

  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [locationStocks, setLocationStocks] = useState<StorageLocationStock[]>([]);
  const [locationStocksLoading, setLocationStocksLoading] = useState(false);
  const [packagingTypes, setPackagingTypes] = useState<PackagingType[]>([]);
  const [storageLocationsLoading, setStorageLocationsLoading] = useState(false);
  const [storageLocationSaving, setStorageLocationSaving] = useState(false);
  const [storageLocationForm, setStorageLocationForm] =
    useState<StorageLocationForm>(initialStorageLocationForm);

    const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerContacts, setCustomerContacts] = useState<CustomerContact[]>([]);
  const [deliveryAddresses, setDeliveryAddresses] = useState<DeliveryAddress[]>([]);
  const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([]);

  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerContactsLoading, setCustomerContactsLoading] = useState(false);
  const [deliveryAddressesLoading, setDeliveryAddressesLoading] = useState(false);
  const [customerNotesLoading, setCustomerNotesLoading] = useState(false);

  const [customerSaving, setCustomerSaving] = useState(false);
  const [customerContactSaving, setCustomerContactSaving] = useState(false);
  const [deliveryAddressSaving, setDeliveryAddressSaving] = useState(false);
  const [customerNoteSaving, setCustomerNoteSaving] = useState(false);

  const [customerForm, setCustomerForm] =
    useState<CustomerForm>(initialCustomerForm);
  const [customerContactForm, setCustomerContactForm] =
    useState<CustomerContactForm>(initialCustomerContactForm);
  const [deliveryAddressForm, setDeliveryAddressForm] =
    useState<DeliveryAddressForm>(initialDeliveryAddressForm);
  const [customerNoteForm, setCustomerNoteForm] =
    useState<CustomerNoteForm>(initialCustomerNoteForm);

const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [supplierSaving, setSupplierSaving] = useState(false);
  const [supplierForm, setSupplierForm] =
    useState<SupplierForm>(initialSupplierForm);


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
  const [movementStorageLocationId, setMovementStorageLocationId] = useState("");
  const [movementPackagingTypeId, setMovementPackagingTypeId] = useState("");
  const [movementLoadCarrierTypeId, setMovementLoadCarrierTypeId] = useState("");
  const [movementPackagingQuantity, setMovementPackagingQuantity] = useState("1");
  const [movementUnitPurchasePrice, setMovementUnitPurchasePrice] = useState("");
  const [movementExpiryDate, setMovementExpiryDate] = useState("");
  const [movementReferenceNumber, setMovementReferenceNumber] = useState("");
  const [movementNote, setMovementNote] = useState("");
  const [movementSaving, setMovementSaving] = useState(false);
  const [movementSearch, setMovementSearch] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState<"" | "IN" | "OUT">("");

  const [goodsOutProductId, setGoodsOutProductId] = useState("");
  const [goodsOutStorageLocationId, setGoodsOutStorageLocationId] = useState("");
  const [goodsOutQuantity, setGoodsOutQuantity] = useState("");
  const [goodsOutReferenceNumber, setGoodsOutReferenceNumber] = useState("");
  const [goodsOutNote, setGoodsOutNote] = useState("");
  const [goodsOutSaving, setGoodsOutSaving] = useState(false);

  const [correctionProductId, setCorrectionProductId] = useState("");
  const [correctionTargetQuantity, setCorrectionTargetQuantity] = useState("");
  const [correctionReference, setCorrectionReference] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionSaving, setCorrectionSaving] = useState(false);

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

const loadPackagingTypes = async () => {
  try {
    const response = await apiFetch("/inventory-api/packaging-types/");
    const data = (await response.json()) as PackagingType[];
    setPackagingTypes(data);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Fehler beim Laden der Verpackungsarten.";
    setError(message);
  }
};

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
  const isReadOnlyRole = role === "viewer";
  const canWrite = !isReadOnlyRole;

const canAccessSection = (section: ActiveSection) => {
  if (role === "admin") return true;

  // Viewer / Recruiter darf alles ansehen, aber nichts schreiben.
  if (role === "viewer") return true;

  // Lager: operative Lagerbereiche.
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

  // Einkauf: Einkauf + Kundenstamm + Bestände.
if (role === "einkauf") {
  return [
    "dashboard",
    "orders",
    "product",
    "suppliers",
    "stock-overview",
    "customers",
    "contacts",
    "addresses",
    "customer-notes",
    "corrections",
  ].includes(section);
}

  // Dispo: Disposition, Bestände, Inventur, Bewegungshistorie.
  if (role === "dispo") {
    return [
      "dashboard",
      "stock-overview",
      "min-stock",
      "reorder",
      "inventory",
      "history",
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
if (role === "einkauf") {
  return sidebarMenus
    .filter(
      (menu) =>
        menu.id === "dashboard" ||
        menu.id === "einkauf" ||
        menu.id === "kundenstamm" ||
        menu.id === "lager"
    )
    .map((menu) => ({
      ...menu,
      items: menu.items.filter((item) => canAccessSection(item.id)),
    }));
}

  if (role === "dispo") {
    return sidebarMenus
      .filter((menu) => menu.id === "dashboard" || menu.id === "dispo")
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

  const loadStorageLocations = async () => {
    try {
      setStorageLocationsLoading(true);

      const response = await apiFetch("/inventory-api/storage-locations/");
      const data = (await response.json()) as StorageLocation[];

      setStorageLocations(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Fehler beim Laden der Lagerorte.";
      setError(message);
    } finally {
      setStorageLocationsLoading(false);
    }
  };


  const loadLocationStocks = async () => {
    try {
      setLocationStocksLoading(true);

      const response = await apiFetch("/inventory-api/location-stocks/");
      const data = (await response.json()) as StorageLocationStock[];

      setLocationStocks(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Fehler beim Laden der Lagerplatzbestände.";
      setError(message);
    } finally {
      setLocationStocksLoading(false);
    }
  };


  const loadSuppliers = async () => {
    try {
      setSuppliersLoading(true);

      const response = await apiFetch("/inventory-api/suppliers/");
      const data = (await response.json()) as Supplier[];

      setSuppliers(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Fehler beim Laden der Lieferanten.";
      setError(message);
    } finally {
      setSuppliersLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      setCustomersLoading(true);
      const response = await apiFetch("/inventory-api/customers/");
      const data = (await response.json()) as Customer[];
      setCustomers(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Fehler beim Laden der Kunden.";
      setError(message);
    } finally {
      setCustomersLoading(false);
    }
  };

  const loadCustomerContacts = async () => {
    try {
      setCustomerContactsLoading(true);
      const response = await apiFetch("/inventory-api/customer-contacts/");
      const data = (await response.json()) as CustomerContact[];
      setCustomerContacts(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Fehler beim Laden der Ansprechpartner.";
      setError(message);
    } finally {
      setCustomerContactsLoading(false);
    }
  };

  const loadDeliveryAddresses = async () => {
    try {
      setDeliveryAddressesLoading(true);
      const response = await apiFetch("/inventory-api/delivery-addresses/");
      const data = (await response.json()) as DeliveryAddress[];
      setDeliveryAddresses(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Fehler beim Laden der Lieferadressen.";
      setError(message);
    } finally {
      setDeliveryAddressesLoading(false);
    }
  };

  const loadCustomerNotes = async () => {
    try {
      setCustomerNotesLoading(true);
      const response = await apiFetch("/inventory-api/customer-notes/");
      const data = (await response.json()) as CustomerNote[];
      setCustomerNotes(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Fehler beim Laden der Kundennotizen.";
      setError(message);
    } finally {
      setCustomerNotesLoading(false);
    }
  };

  const loadAdminUsers = async () => {
    if (role !== "admin") return;

    try {
      setAdminUsersLoading(true);
      const response = await apiFetch("/inventory-api/admin-users/");
      const data = (await response.json()) as AdminUser[];
      setAdminUsers(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Fehler beim Laden der Benutzer.";
      setError(message);
    } finally {
      setAdminUsersLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    if (role !== "admin") return;

    try {
      setAuditLogsLoading(true);
      const response = await apiFetch("/inventory-api/audit-logs/");
      const data = (await response.json()) as AuditLog[];
      setAuditLogs(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Fehler beim Laden des Systemprotokolls.";
      setError(message);
    } finally {
      setAuditLogsLoading(false);
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
    void loadStorageLocations();
    void loadLocationStocks();
    void loadPackagingTypes();
    void loadSuppliers();
    void loadCustomers();
    void loadCustomerContacts();
    void loadDeliveryAddresses();
    void loadCustomerNotes();
    }
    }, [loggedIn]);

  useEffect(() => {
    if (loggedIn && role === "admin") {
      void loadAdminUsers();
      void loadAuditLogs();
    }
  }, [loggedIn, role]);

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

  const selectedCorrectionProduct = useMemo(() => {
    return products.find((product) => String(product.id) === correctionProductId) ?? null;
  }, [products, correctionProductId]);

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
  const correctionMovements = useMemo(() => {
    return movements.filter((movement) => {
      const reference = (movement.reference_number ?? "").toLowerCase();
      const note = (movement.note ?? "").toLowerCase();

      return reference.startsWith("korr") || note.includes("lagerkorrektur");
    });
  }, [movements]);

  const canShowProductOverview = ["product", "stock-overview", "min-stock"].includes(activeSection);

  const handleSupplierChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setSupplierForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCreateSupplier = async (event: FormEvent) => {
    event.preventDefault();

    if (!(role === "admin" || role === "einkauf")) {
      setError("Nur Admin oder Einkauf dürfen Lieferanten anlegen.");
      return;
    }

    if (!supplierForm.name.trim()) {
      setError("Bitte einen Lieferantennamen eintragen.");
      return;
    }

    try {
      setSupplierSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        ...supplierForm,
        supplier_number: supplierForm.supplier_number.trim() || null,
      };

      const response = await apiFetch("/inventory-api/suppliers/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.supplier_number) {
          throw new Error(
            "Diese Lieferantennummer existiert bereits. Bitte eine andere Nummer verwenden."
          );
        }

        throw new Error(JSON.stringify(errorData));
      }

      setSupplierForm(initialSupplierForm);
      await loadSuppliers();

      setSuccess("🚚 Lieferant erfolgreich angelegt.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Fehler beim Anlegen des Lieferanten.";
      setError(message);
    } finally {
      setSupplierSaving(false);
    }
  };

  const canManageCustomerMaster = role === "admin" || role === "einkauf";

  const handleCustomerChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setCustomerForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateCustomer = async (event: FormEvent) => {
    event.preventDefault();

    if (!canManageCustomerMaster) {
      setError("Nur Admin oder Einkauf dürfen Kunden anlegen.");
      return;
    }

    if (!customerForm.name.trim()) {
      setError("Bitte einen Kundennamen eintragen.");
      return;
    }

    try {
      setCustomerSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        ...customerForm,
        customer_number: customerForm.customer_number.trim() || null,
      };

      const response = await apiFetch("/inventory-api/customers/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.customer_number) {
          throw new Error(
            "Diese Kundennummer existiert bereits. Bitte eine andere Nummer verwenden."
          );
        }

        throw new Error(JSON.stringify(errorData));
      }

      setCustomerForm(initialCustomerForm);
      await loadCustomers();
      setSuccess("👥 Kunde erfolgreich angelegt.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Fehler beim Anlegen des Kunden.";
      setError(message);
    } finally {
      setCustomerSaving(false);
    }
  };

  const handleCustomerContactChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setCustomerContactForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateCustomerContact = async (event: FormEvent) => {
    event.preventDefault();

    if (!canManageCustomerMaster) {
      setError("Nur Admin oder Einkauf dürfen Ansprechpartner anlegen.");
      return;
    }

    if (!customerContactForm.customer) {
      setError("Bitte einen Kunden auswählen.");
      return;
    }

    if (!customerContactForm.last_name.trim()) {
      setError("Bitte mindestens einen Nachnamen eintragen.");
      return;
    }

    try {
      setCustomerContactSaving(true);
      setError("");
      setSuccess("");

      const response = await apiFetch("/inventory-api/customer-contacts/", {
        method: "POST",
        body: JSON.stringify({
          ...customerContactForm,
          customer: Number(customerContactForm.customer),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      setCustomerContactForm(initialCustomerContactForm);
      await loadCustomerContacts();
      await loadCustomers();
      setSuccess("☎️ Ansprechpartner erfolgreich angelegt.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Fehler beim Anlegen des Ansprechpartners.";
      setError(message);
    } finally {
      setCustomerContactSaving(false);
    }
  };

  const handleDeliveryAddressChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setDeliveryAddressForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateDeliveryAddress = async (event: FormEvent) => {
    event.preventDefault();

    if (!canManageCustomerMaster) {
      setError("Nur Admin oder Einkauf dürfen Lieferadressen anlegen.");
      return;
    }

    if (!deliveryAddressForm.customer) {
      setError("Bitte einen Kunden auswählen.");
      return;
    }

    if (!deliveryAddressForm.street.trim()) {
      setError("Bitte eine Straße eintragen.");
      return;
    }

    if (!deliveryAddressForm.postal_code.trim() || !deliveryAddressForm.city.trim()) {
      setError("Bitte PLZ und Ort eintragen.");
      return;
    }

    try {
      setDeliveryAddressSaving(true);
      setError("");
      setSuccess("");

      const response = await apiFetch("/inventory-api/delivery-addresses/", {
        method: "POST",
        body: JSON.stringify({
          ...deliveryAddressForm,
          customer: Number(deliveryAddressForm.customer),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      setDeliveryAddressForm(initialDeliveryAddressForm);
      await loadDeliveryAddresses();
      await loadCustomers();
      setSuccess("📦 Lieferadresse erfolgreich angelegt.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Fehler beim Anlegen der Lieferadresse.";
      setError(message);
    } finally {
      setDeliveryAddressSaving(false);
    }
  };

  const handleCustomerNoteChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setCustomerNoteForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateCustomerNote = async (event: FormEvent) => {
    event.preventDefault();

    if (!canManageCustomerMaster) {
      setError("Nur Admin oder Einkauf dürfen Kundennotizen anlegen.");
      return;
    }

    if (!customerNoteForm.customer) {
      setError("Bitte einen Kunden auswählen.");
      return;
    }

    if (!customerNoteForm.title.trim() || !customerNoteForm.note.trim()) {
      setError("Bitte Titel und Notiz eintragen.");
      return;
    }

    try {
      setCustomerNoteSaving(true);
      setError("");
      setSuccess("");

      const response = await apiFetch("/inventory-api/customer-notes/", {
        method: "POST",
        body: JSON.stringify({
          ...customerNoteForm,
          customer: Number(customerNoteForm.customer),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      setCustomerNoteForm(initialCustomerNoteForm);
      await loadCustomerNotes();
      await loadCustomers();
      setSuccess("📝 Kundennotiz erfolgreich angelegt.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Fehler beim Anlegen der Kundennotiz.";
      setError(message);
    } finally {
      setCustomerNoteSaving(false);
    }
  };

  const handleAdminUserChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setAdminUserForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAdminUserActiveChange = (checked: boolean) => {
    setAdminUserForm((current) => ({
      ...current,
      is_active: checked,
    }));
  };

  const handleCreateAdminUser = async (event: FormEvent) => {
    event.preventDefault();

    if (role !== "admin") {
      setError("Nur Admins dürfen Benutzer anlegen.");
      return;
    }

    if (!adminUserForm.username.trim()) {
      setError("Bitte einen Benutzernamen eintragen.");
      return;
    }

    if (!adminUserForm.password.trim()) {
      setError("Bitte ein Startpasswort eintragen.");
      return;
    }

    try {
      setAdminUserSaving(true);
      setError("");
      setSuccess("");

      const response = await apiFetch("/inventory-api/admin-users/", {
        method: "POST",
        body: JSON.stringify(adminUserForm),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.username) {
          throw new Error("Dieser Benutzername existiert bereits.");
        }

        throw new Error(JSON.stringify(errorData));
      }

      setAdminUserForm(initialAdminUserForm);
      await loadAdminUsers();
      await loadAuditLogs();

      setSuccess("👤 Benutzer erfolgreich angelegt.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Fehler beim Anlegen des Benutzers.";
      setError(message);
    } finally {
      setAdminUserSaving(false);
    }
  };

  const handleUpdateAdminUserRole = async (
    userId: number,
    newRole: string
  ) => {
    if (role !== "admin") {
      setError("Nur Admins dürfen Rollen ändern.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await apiFetch(`/inventory-api/admin-users/${userId}/`, {
        method: "PATCH",
        body: JSON.stringify({
          role: newRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      await loadAdminUsers();
      await loadAuditLogs();

      setSuccess("🔐 Rolle erfolgreich aktualisiert.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Fehler beim Ändern der Rolle.";
      setError(message);
    }
  };

  const handleToggleAdminUserActive = async (
    userId: number,
    isActive: boolean,
    username: string
  ) => {
    if (role !== "admin") {
      setError("Nur Admins dürfen Benutzer aktivieren oder deaktivieren.");
      return;
    }

    if (user?.username === username && !isActive) {
      setError("Du kannst deinen eigenen aktuell angemeldeten Benutzer nicht deaktivieren.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await apiFetch(`/inventory-api/admin-users/${userId}/`, {
        method: "PATCH",
        body: JSON.stringify({
          is_active: isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      await loadAdminUsers();
      await loadAuditLogs();

      setSuccess(
        isActive
          ? "✅ Benutzer wurde aktiviert."
          : "⛔ Benutzer wurde deaktiviert."
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Fehler beim Ändern des Benutzerstatus.";
      setError(message);
    }
  };

  const handleCreatePurchaseOrderDraft = (product: ReorderSuggestion) => {
    if (!canWrite) {
      setError(
        "Nur-Lese-Modus: Du kannst Nachbestellvorschläge ansehen, aber keine Bestellung vorbereiten."
      );
      return;
    }

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

  const handleRemovePurchaseOrderDraft = (draftId: number) => {
    if (!canWrite) {
      setError("Nur-Lese-Modus: Du kannst Bestellungen ansehen, aber nicht entfernen.");
      return;
    }

    setPurchaseOrderDrafts((current) =>
      current.filter((draft) => draft.id !== draftId)
    );

    setSuccess("🗑️ Bestellentwurf entfernt.");
  };

  const handleApprovePurchaseOrderDraft = (draftId: number) => {
    if (!canWrite) {
      setError("Nur-Lese-Modus: Du kannst Bestellungen ansehen, aber nicht freigeben.");
      return;
    }

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
  weight_kg: product.weight_kg ? String(product.weight_kg) : "",
  removal_strategy: product.removal_strategy || "FIFO",
  putaway_strategy: product.putaway_strategy || "EMPTY_BIN",
  fixed_storage_location: product.fixed_storage_location
    ? String(product.fixed_storage_location)
    : "",
  storage_location: product.storage_location
    ? String(product.storage_location)
    : "",
  packaging_type: product.packaging_type ? String(product.packaging_type) : "",
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
    if (form.weight_kg !== "" && Number(form.weight_kg) < 0) return "Produktgewicht muss 0 oder größer sein.";
    if (form.putaway_strategy === "FIXED_BIN" && !form.fixed_storage_location) return "Bei Festplatz-Strategie bitte einen Festplatz auswählen.";
    return "";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!hasPermission("admin")) {
      setError("Nur-Lese-Modus: Du kannst Produkte ansehen, aber nicht speichern.");
      return;
    }
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
    weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
    removal_strategy: form.removal_strategy,
    putaway_strategy: form.putaway_strategy,
    fixed_storage_location: form.fixed_storage_location
      ? Number(form.fixed_storage_location)
      : null,
    storage_location: form.storage_location
      ? Number(form.storage_location)
      : null,
    packaging_type: form.packaging_type
      ? Number(form.packaging_type)
      : null,
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
    if (!movementStorageLocationId) return "Bitte einen Lagerplatz für den Wareneingang auswählen.";
    if (!movementPackagingTypeId) return "Bitte eine Verpackung für den Wareneingang auswählen.";
    if (!movementLoadCarrierTypeId) return "Bitte einen Ladungsträger für den Wareneingang auswählen.";
    if (!movementReferenceNumber.trim()) return "Bitte eine Referenznummer oder Lieferscheinnummer eintragen.";
    return "";
  };

  const handleGoodsReceipt = async (event: FormEvent) => {
    event.preventDefault();

    if (!hasPermission("lager")) {
      setError("Nur-Lese-Modus: Du kannst Wareneingänge ansehen, aber nicht buchen.");
      return;
    }

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

        storage_location: movementStorageLocationId
          ? Number(movementStorageLocationId)
          : null,

        packaging_type: movementPackagingTypeId
          ? Number(movementPackagingTypeId)
          : null,

        load_carrier_type: movementLoadCarrierTypeId
          ? Number(movementLoadCarrierTypeId)
          : null,

        packaging_quantity: Number(movementPackagingQuantity || 1),

        unit_purchase_price: movementUnitPurchasePrice
          ? Number(movementUnitPurchasePrice)
          : null,

        expiry_date: movementExpiryDate || null,

        reference_number: movementReferenceNumber.trim(),
        note: movementNote,
      }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        const formattedError =
          typeof errorData === "object" && errorData !== null
            ? Object.entries(errorData as Record<string, unknown>)
                .map(([field, value]) => {
                  const label =
                    field === "storage_location"
                      ? "Lagerplatz"
                      : field === "quantity"
                      ? "Menge"
                      : field === "packaging_quantity"
                      ? "Packmenge"
                      : field === "packaging_type"
                      ? "Verpackung"
                      : field === "load_carrier_type"
                      ? "Ladungsträger"
                      : field;

                  const text = Array.isArray(value)
                    ? value.join(" ")
                    : String(value);

                  return `${label}: ${text}`;
                })
                .join("\n")
            : "Fehler beim Wareneingang.";

        throw new Error(formattedError || "Fehler beim Wareneingang.");
      }

      setMovementProductId("");
      setMovementQuantity("");
      setMovementStorageLocationId("");
      setMovementPackagingTypeId("");
      setMovementLoadCarrierTypeId("");
      setMovementPackagingQuantity("1");
      setMovementUnitPurchasePrice("");
      setMovementExpiryDate("");
      setMovementReferenceNumber("");
      setMovementNote("");

      await loadProducts();
      await loadMovements();
      await loadStorageLocations();
      await loadLocationStocks();

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
    if (!goodsOutStorageLocationId) return "Bitte einen Lagerplatz für den Warenausgang auswählen.";
    if (!goodsOutReferenceNumber.trim()) return "Bitte eine Referenznummer für den Warenausgang eintragen.";
    return "";
  };

  const handleGoodsIssue = async (event: FormEvent) => {
    event.preventDefault();

    if (!hasPermission("lager")) {
      setError("Nur-Lese-Modus: Du kannst Warenausgänge ansehen, aber nicht buchen.");
      return;
    }

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
          storage_location: goodsOutStorageLocationId
            ? Number(goodsOutStorageLocationId)
            : null,
          reference_number: goodsOutReferenceNumber.trim(),
          note: goodsOutNote,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      setGoodsOutProductId("");
      setGoodsOutStorageLocationId("");
      setGoodsOutQuantity("");
      setGoodsOutReferenceNumber("");
      setGoodsOutNote("");

      await loadProducts();
      await loadMovements();
      await loadStorageLocations();
      await loadLocationStocks();

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

  const handleStorageLocationChange = (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = event.target;

      setStorageLocationForm((current) => ({
        ...current,
        [name]: value,
      }));
    };

    const handleCreateStorageLocation = async (event: FormEvent) => {
      event.preventDefault();

      if (!hasPermission("admin")) {
        setError("Nur Admins dürfen Lagerorte anlegen.");
        return;
      }

      if (!storageLocationForm.code.trim()) {
        setError("Bitte einen Lagerort-Code eintragen.");
        return;
      }

      if (!storageLocationForm.name.trim()) {
        setError("Bitte einen Namen für den Lagerort eintragen.");
        return;
      }

      try {
        setStorageLocationSaving(true);
        setError("");
        setSuccess("");

        const response = await apiFetch("/inventory-api/storage-locations/", {
          method: "POST",
          body: JSON.stringify(storageLocationForm),
        });

       if (!response.ok) {
        const errorData = await response.json();

        if (errorData.code) {
          throw new Error("Dieser Lagerort-Code existiert bereits. Bitte einen anderen Code verwenden.");
        }

        throw new Error(JSON.stringify(errorData));
      }
        setStorageLocationForm(initialStorageLocationForm);
        await loadStorageLocations();

        setSuccess("📍 Lagerort erfolgreich angelegt.");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Fehler beim Anlegen des Lagerorts.";
        setError(message);
      } finally {
        setStorageLocationSaving(false);
      }


  };

  const handleStockCorrection = async (event: FormEvent) => {
    event.preventDefault();

    if (!hasPermission("lager")) {
      setError("Nur-Lese-Modus: Du kannst Lagerkorrekturen ansehen, aber nicht buchen.");
      return;
    }

    if (!selectedCorrectionProduct) {
      setError("Bitte ein Produkt für die Lagerkorrektur auswählen.");
      return;
    }

    if (correctionTargetQuantity === "" || Number(correctionTargetQuantity) < 0) {
      setError("Der Zielbestand muss 0 oder größer sein.");
      return;
    }

    if (!correctionReason.trim()) {
      setError("Bitte eine Begründung für die Lagerkorrektur eintragen.");
      return;
    }

    const targetQuantity = Number(correctionTargetQuantity);
    const currentQuantity = selectedCorrectionProduct.quantity;
    const difference = targetQuantity - currentQuantity;

    if (difference === 0) {
      setError("Keine Lagerkorrektur notwendig: Zielbestand entspricht dem aktuellen Bestand.");
      return;
    }

    const movementType = difference > 0 ? "IN" : "OUT";
    const movementQuantity = Math.abs(difference);

    const confirmed = window.confirm(
      `Lagerkorrektur für "${selectedCorrectionProduct.name}" buchen?\n\nAktueller Bestand: ${currentQuantity}\nZielbestand: ${targetQuantity}\nDifferenz: ${difference > 0 ? "+" : ""}${difference}`
    );

    if (!confirmed) return;

    try {
      setCorrectionSaving(true);
      setError("");
      setSuccess("");

      const response = await apiFetch("/inventory-api/stock-movements/", {
        method: "POST",
        body: JSON.stringify({
          product: selectedCorrectionProduct.id,
          movement_type: movementType,
          quantity: movementQuantity,
          reference_number:
            correctionReference.trim() ||
            `KORR-${new Date().toISOString().slice(0, 10)}-${selectedCorrectionProduct.id}`,
          note:
            `Lagerkorrektur: ${correctionReason.trim()}. ` +
            `Systembestand ${currentQuantity}, Zielbestand ${targetQuantity}, ` +
            `Differenz ${difference > 0 ? "+" : ""}${difference}.`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      setCorrectionProductId("");
      setCorrectionTargetQuantity("");
      setCorrectionReference("");
      setCorrectionReason("");

      await loadProducts();
      await loadMovements();

      setSuccess("🔧 Lagerkorrektur erfolgreich gebucht.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Fehler beim Buchen der Lagerkorrektur.";
      setError(message);
    } finally {
      setCorrectionSaving(false);
    }
  };

  const handleCreateInventorySession = async (event: FormEvent) => {
    event.preventDefault();

    if (!hasPermission("lager")) {
      setError("Nur-Lese-Modus: Du kannst Inventuren ansehen, aber keine Inventur starten.");
      return;
    }
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

    if (!hasPermission("lager")) {
      setError("Nur-Lese-Modus: Du kannst Inventuren ansehen, aber keine Zählung speichern.");
      return;
    }
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
    if (!hasPermission("lager")) {
      setError("Nur-Lese-Modus: Du kannst Inventurkorrekturen ansehen, aber nicht buchen.");
      return;
    }

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
    if (!hasPermission("lager")) {
      setError("Nur-Lese-Modus: Du kannst Inventuren ansehen, aber nicht abschließen.");
      return;
    }

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

const exportLocationStocksToExcel = async () => {
  try {
    setError("");
    setSuccess("");

    const response = await apiFetch(
      "/inventory-api/location-stocks/export-excel/"
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Fehler beim Excel-Export.");
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("Content-Disposition") || "";
    const filenameMatch = contentDisposition.match(/filename="?([^\"]+)"?/);
    const filename = filenameMatch?.[1] || "lagerplatzbestand.xlsx";

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    setSuccess("📤 Lagerplatzbestand erfolgreich als Excel exportiert!");
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Fehler beim Export des Lagerplatzbestands.";

    setError(message);
  }
};

  const handleExportInventoryPdf = async () => {
    if (!selectedInventorySessionId) {
      setError("Bitte zuerst eine Inventur auswählen.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await apiFetch(
        `/inventory-api/inventory-sessions/${selectedInventorySessionId}/export-pdf/`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Fehler beim PDF-Export.");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition") || "";
      const filenameMatch = contentDisposition.match(/filename="?([^\"]+)"?/);
      const filename = filenameMatch?.[1] || `inventurbericht-${selectedInventorySessionId}.pdf`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      setSuccess("📄 Inventurbericht erfolgreich als PDF exportiert!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Fehler beim PDF-Export.";

      setError(message);
    }
  };

const exportMovementsToCsv = async () => {
  try {
    setError("");
    setSuccess("");

    const response = await apiFetch(
      "/inventory-api/stock-movements/export-excel/"
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Fehler beim Excel-Export.");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "bewegungshistorie.xlsx";
    link.click();

    URL.revokeObjectURL(url);

    setSuccess("📤 Bewegungshistorie erfolgreich als Excel exportiert!");
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Fehler beim Export der Bewegungshistorie.";

    setError(message);
  }
};

  const locationStockChartData = useMemo(() => {
    const byLocation = new Map<
      string,
      { label: string; name: string; quantity: number }
    >();

    locationStocks.forEach((stock) => {
      const key = stock.storage_location_code || String(stock.storage_location);
      const current =
        byLocation.get(key) ??
        {
          label: stock.storage_location_code || "Unbekannt",
          name: stock.storage_location_name || "",
          quantity: 0,
        };

      current.quantity += stock.quantity;
      byLocation.set(key, current);
    });

    return Array.from(byLocation.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);
  }, [locationStocks]);

  const maxLocationStockQuantity = locationStockChartData.length
    ? Math.max(...locationStockChartData.map((item) => item.quantity), 1)
    : 1;

  const movementTrendData = useMemo(() => {
    const formatDateKey = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - index));

      return {
        key: formatDateKey(day),
        label: day.toLocaleDateString("de-DE", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        }),
        inQty: 0,
        outQty: 0,
      };
    });

    const dayMap = new Map(days.map((day) => [day.key, day]));

    movements.forEach((movement) => {
      const movementDate = new Date(movement.created_at);
      const movementKey = formatDateKey(movementDate);
      const day = dayMap.get(movementKey);

      if (!day) return;

      if (movement.movement_type === "IN") {
        day.inQty += movement.quantity;
      } else {
        day.outQty += movement.quantity;
      }
    });

    return days;
  }, [movements]);

  const maxMovementTrendQuantity = movementTrendData.length
    ? Math.max(
        ...movementTrendData.flatMap((day) => [day.inQty, day.outQty]),
        1
      )
    : 1;

  const storageLocationStatusData = useMemo(() => {
    const occupied = storageLocations.filter(
      (location) => !location.is_empty
    ).length;
    const free = storageLocations.filter((location) => location.is_empty).length;

    return [
      { label: "Belegt", value: occupied },
      { label: "Frei", value: free },
    ];
  }, [storageLocations]);

  const maxStorageLocationStatusValue = Math.max(
    ...storageLocationStatusData.map((item) => item.value),
    1
  );

  const lowStockChartData = useMemo(
    () =>
      lowStockProducts
        .slice()
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 6)
        .map((product) => ({
          label: product.sku || product.name,
          name: product.name,
          quantity: product.quantity,
          minStock: product.min_stock,
          unit: product.unit,
        })),
    [lowStockProducts]
  );

  const maxLowStockChartValue = lowStockChartData.length
    ? Math.max(
        ...lowStockChartData.flatMap((item) => [
          item.quantity,
          item.minStock,
        ]),
        1
      )
    : 1;

  if (!loggedIn) {
    return (
      <div style={isMobileLayout ? pageStyleMobile : pageStyle}>
        <LoginForm onLoginSuccess={() => setLoggedIn(true)} />
      </div>
    );
  }

  return (
    <div style={isMobileLayout ? pageStyleMobile : pageStyle}>
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

          <main style={isCompactLayout ? contentAreaMobileStyle : contentAreaStyle}>
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
              <Card title="Verpackungsarten" value={String(packagingTypes.length)} />
              <Card title="Bestand gesamt" value={String(totalUnits)} />
              <Card title="Niedriger Bestand" value={String(lowStockProducts.length)} danger={lowStockProducts.length > 0} />
              <Card title="Inventur-Differenzen" value={String(inventorySummary.differences)} danger={inventorySummary.differences > 0} />
            </section>

            {error && <p style={errorStyle}>Fehler: {error}</p>}
            {success && <p style={successStyle}>{success}</p>}

            {activeSection === "dashboard" && (
              <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>📊 Dashboard Übersicht</h2>
                <p style={infoStyle}>
                  Zentrale Übersicht über Lagerbestände, kritische Artikel,
                  Tagesbewegungen, Lagerplatzstatus und Inventurstatus.
                </p>

                <div style={dashboardGridStyle}>
                  <Card title="Produkte gesamt" value={String(totalProducts)} />
                  <Card title="Bestand gesamt" value={String(totalUnits)} />
                  <Card
                    title="Niedriger Bestand"
                    value={String(lowStockProducts.length)}
                    danger={lowStockProducts.length > 0}
                  />
                  <Card
                    title="Inventur-Differenzen"
                    value={String(inventorySummary.differences)}
                    danger={inventorySummary.differences > 0}
                  />
                  <Card title="Wareneingänge heute" value={String(goodsInToday)} />
                  <Card title="Warenausgänge heute" value={String(goodsOutToday)} />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "18px",
                    marginTop: "24px",
                  }}
                >
                  <div style={dashboardChartCardStyle}>
                    <h3 style={dashboardChartTitleStyle}>
                      📦 Bestand nach Lagerplatz
                    </h3>

                    {locationStockChartData.length > 0 ? (
                      <div style={{ display: "grid", gap: "12px" }}>
                        {locationStockChartData.map((item) => {
                          const percent = Math.max(
                            6,
                            Math.round(
                              (item.quantity / maxLocationStockQuantity) * 100
                            )
                          );

                          return (
                            <div key={item.label}>
                              <div style={dashboardChartLabelRowStyle}>
                                <span>
                                  <strong>{item.label}</strong>
                                  {item.name ? ` · ${item.name}` : ""}
                                </span>
                                <span>{item.quantity}</span>
                              </div>
                              <div style={dashboardBarTrackStyle}>
                                <div
                                  style={{
                                    ...dashboardBarStyle,
                                    width: `${percent}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={infoStyle}>Noch keine Lagerplatzbestände vorhanden.</p>
                    )}
                  </div>

                  <div style={dashboardChartCardStyle}>
                    <h3 style={dashboardChartTitleStyle}>
                      🔁 Bewegungen letzte 7 Tage
                    </h3>

                    <div style={{ display: "grid", gap: "12px" }}>
                      {movementTrendData.map((day) => {
                        const inPercent = Math.max(
                          day.inQty > 0 ? 6 : 0,
                          Math.round(
                            (day.inQty / maxMovementTrendQuantity) * 100
                          )
                        );
                        const outPercent = Math.max(
                          day.outQty > 0 ? 6 : 0,
                          Math.round(
                            (day.outQty / maxMovementTrendQuantity) * 100
                          )
                        );

                        return (
                          <div key={day.key}>
                            <div style={dashboardChartLabelRowStyle}>
                              <strong>{day.label}</strong>
                              <span>
                                WE {day.inQty} / WA {day.outQty}
                              </span>
                            </div>

                            <div style={dashboardMiniBarRowStyle}>
                              <span style={dashboardMiniBarLabelStyle}>WE</span>
                              <div style={dashboardBarTrackStyle}>
                                <div
                                  style={{
                                    ...dashboardBarStyle,
                                    width: `${inPercent}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div style={dashboardMiniBarRowStyle}>
                              <span style={dashboardMiniBarLabelStyle}>WA</span>
                              <div style={dashboardBarTrackStyle}>
                                <div
                                  style={{
                                    ...dashboardDangerBarStyle,
                                    width: `${outPercent}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={dashboardChartCardStyle}>
                    <h3 style={dashboardChartTitleStyle}>
                      📍 Lagerplatzstatus
                    </h3>

                    <div style={{ display: "grid", gap: "14px" }}>
                      {storageLocationStatusData.map((item) => {
                        const percent = Math.max(
                          item.value > 0 ? 8 : 0,
                          Math.round(
                            (item.value / maxStorageLocationStatusValue) * 100
                          )
                        );

                        return (
                          <div key={item.label}>
                            <div style={dashboardChartLabelRowStyle}>
                              <strong>{item.label}</strong>
                              <span>{item.value}</span>
                            </div>
                            <div style={dashboardBarTrackStyle}>
                              <div
                                style={{
                                  ...dashboardBarStyle,
                                  width: `${percent}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={dashboardChartCardStyle}>
                    <h3 style={dashboardChartTitleStyle}>
                      ⚠️ Kritische Artikel
                    </h3>

                    {lowStockChartData.length > 0 ? (
                      <div style={{ display: "grid", gap: "12px" }}>
                        {lowStockChartData.map((item) => {
                          const stockPercent = Math.max(
                            item.quantity > 0 ? 6 : 0,
                            Math.round(
                              (item.quantity / maxLowStockChartValue) * 100
                            )
                          );
                          const minPercent = Math.max(
                            item.minStock > 0 ? 6 : 0,
                            Math.round(
                              (item.minStock / maxLowStockChartValue) * 100
                            )
                          );

                          return (
                            <div key={item.label}>
                              <div style={dashboardChartLabelRowStyle}>
                                <span title={item.name}>
                                  <strong>{item.label}</strong>
                                </span>
                                <span>
                                  {item.quantity}/{item.minStock} {item.unit}
                                </span>
                              </div>

                              <div style={dashboardMiniBarRowStyle}>
                                <span style={dashboardMiniBarLabelStyle}>Ist</span>
                                <div style={dashboardBarTrackStyle}>
                                  <div
                                    style={{
                                      ...dashboardDangerBarStyle,
                                      width: `${stockPercent}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              <div style={dashboardMiniBarRowStyle}>
                                <span style={dashboardMiniBarLabelStyle}>Min</span>
                                <div style={dashboardBarTrackStyle}>
                                  <div
                                    style={{
                                      ...dashboardWarningBarStyle,
                                      width: `${minPercent}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={infoStyle}>
                        Keine kritischen Artikel unter Mindestbestand.
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: "22px" }}>
                  <h3
                    style={{
                      color: "#bfdbfe",
                      marginBottom: "10px",
                      textAlign: "center",
                    }}
                  >
                    Letzte Lagerbewegung
                  </h3>
                  {latestMovement ? (
                    <div style={infoStyle}>
                      <strong>{latestMovement.product_name}</strong>
                      <br />
                      Typ:{" "}
                      <strong>
                        {latestMovement.movement_type === "IN"
                          ? "Wareneingang"
                          : "Warenausgang"}
                      </strong>
                      <br />
                      Menge: <strong>{latestMovement.quantity}</strong>
                      <br />
                      Datum:{" "}
                      <strong>
                        {new Date(latestMovement.created_at).toLocaleString(
                          "de-DE"
                        )}
                      </strong>
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
              canWrite={canWrite}
              onRemoveDraft={handleRemovePurchaseOrderDraft}
              onApproveDraft={handleApprovePurchaseOrderDraft}
            />
            )}
            {activeSection === "suppliers" && (
              <SuppliersSection
                suppliers={suppliers}
                loading={suppliersLoading}
                form={supplierForm}
                saving={supplierSaving}
                canManage={role === "admin" || role === "einkauf"}
                onChange={handleSupplierChange}
                onToggleActive={(checked) =>
                  setSupplierForm((current) => ({
                    ...current,
                    is_active: checked,
                  }))
                }
                onSubmit={handleCreateSupplier}
              />
            )}
            {activeSection === "reorder" && (
              <ReorderSection
              suggestions={reorderSuggestions}
              draftedProductIds={draftedProductIds}
              canWrite={canWrite}
              onCreateOrderDraft={handleCreatePurchaseOrderDraft}
            />
            )}
            {activeSection === "corrections" && (
              <StockCorrectionsSection
                products={products}
                selectedProduct={selectedCorrectionProduct}
                correctionProductId={correctionProductId}
                setCorrectionProductId={setCorrectionProductId}
                correctionTargetQuantity={correctionTargetQuantity}
                setCorrectionTargetQuantity={setCorrectionTargetQuantity}
                correctionReference={correctionReference}
                setCorrectionReference={setCorrectionReference}
                correctionReason={correctionReason}
                setCorrectionReason={setCorrectionReason}
                correctionSaving={correctionSaving}
                correctionMovements={correctionMovements}
                canManage={hasPermission("lager")}
                onSubmit={handleStockCorrection}
              />
            )}
        
          {activeSection === "locations" && (
          <StorageLocationsSection
          title="📍 Lagerorte"
          locations={storageLocations}
          loading={storageLocationsLoading}
          form={storageLocationForm}
          saving={storageLocationSaving}
          canManage={hasPermission("admin")}
          onChange={handleStorageLocationChange}
          onToggleActive={(checked) =>
            setStorageLocationForm((current) => ({
              ...current,
              is_active: checked,
            }))
          }
          onSubmit={handleCreateStorageLocation}
        />
      )}



            {activeSection === "customers" && (
              <CustomersSection
                customers={customers}
                loading={customersLoading}
                form={customerForm}
                saving={customerSaving}
                canManage={canManageCustomerMaster}
                onChange={handleCustomerChange}
                onToggleActive={(checked) =>
                  setCustomerForm((current) => ({
                    ...current,
                    is_active: checked,
                  }))
                }
                onSubmit={handleCreateCustomer}
              />
            )}
            {activeSection === "contacts" && (
              <CustomerContactsSection
                customers={customers}
                contacts={customerContacts}
                loading={customerContactsLoading}
                form={customerContactForm}
                saving={customerContactSaving}
                canManage={canManageCustomerMaster}
                onChange={handleCustomerContactChange}
                onTogglePrimary={(checked) =>
                  setCustomerContactForm((current) => ({
                    ...current,
                    is_primary: checked,
                  }))
                }
                onToggleActive={(checked) =>
                  setCustomerContactForm((current) => ({
                    ...current,
                    is_active: checked,
                  }))
                }
                onSubmit={handleCreateCustomerContact}
              />
            )}
            {activeSection === "addresses" && (
              <DeliveryAddressesSection
                customers={customers}
                addresses={deliveryAddresses}
                loading={deliveryAddressesLoading}
                form={deliveryAddressForm}
                saving={deliveryAddressSaving}
                canManage={canManageCustomerMaster}
                onChange={handleDeliveryAddressChange}
                onToggleDefault={(checked) =>
                  setDeliveryAddressForm((current) => ({
                    ...current,
                    is_default: checked,
                  }))
                }
                onToggleActive={(checked) =>
                  setDeliveryAddressForm((current) => ({
                    ...current,
                    is_active: checked,
                  }))
                }
                onSubmit={handleCreateDeliveryAddress}
              />
            )}
            {activeSection === "customer-notes" && (
              <CustomerNotesSection
                customers={customers}
                notes={customerNotes}
                loading={customerNotesLoading}
                form={customerNoteForm}
                saving={customerNoteSaving}
                canManage={canManageCustomerMaster}
                onChange={handleCustomerNoteChange}
                onSubmit={handleCreateCustomerNote}
              />
            )}
            {activeSection === "admin-users" && (
              <AdminUsersSection
                users={adminUsers}
                loading={adminUsersLoading}
                form={adminUserForm}
                saving={adminUserSaving}
                canManage={role === "admin"}
                onChange={handleAdminUserChange}
                onToggleActive={handleAdminUserActiveChange}
                onToggleUserActive={handleToggleAdminUserActive}
                onSubmit={handleCreateAdminUser}
              />
            )}
            {activeSection === "admin-rights" && (
              <RoleRightsSection
                users={adminUsers}
                canManage={role === "admin"}
                onChangeUserRole={handleUpdateAdminUserRole}
              />
            )}
            {activeSection === "admin-locations" && (
              <StorageLocationsSection
                title=" Lagerorte anlegen"
                locations={storageLocations}
                loading={storageLocationsLoading}
                form={storageLocationForm}
                saving={storageLocationSaving}
                canManage={hasPermission("admin")}
                onChange={handleStorageLocationChange}
                onToggleActive={(checked) =>
                  setStorageLocationForm((current) => ({
                    ...current,
                    is_active: checked,
                  }))
                }
                onSubmit={handleCreateStorageLocation}
              />
            )}


            {activeSection === "admin-audit" && (
              <AuditLogSection
                logs={auditLogs}
                loading={auditLogsLoading}
                canView={role === "admin"}
              />
            )}

            {activeSection === "product" && (
             <ProductFormSection
              form={form}
              editingId={editingId}
              saving={saving}
              hasPermission={hasPermission}
              handleSubmit={handleSubmit}
              handleChange={handleChange}
              setForm={setForm}
              storageLocations={storageLocations}
              packagingTypes={packagingTypes}
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
                storageLocations={storageLocations}
                movementProductId={movementProductId}
                setMovementProductId={setMovementProductId}
                movementQuantity={movementQuantity}
                setMovementQuantity={setMovementQuantity}
                movementReferenceNumber={movementReferenceNumber}
                setMovementReferenceNumber={setMovementReferenceNumber}
                movementNote={movementNote}
                setMovementNote={setMovementNote}
                movementStorageLocationId={movementStorageLocationId}
                setMovementStorageLocationId={setMovementStorageLocationId}
                movementSaving={movementSaving}
                hasPermission={hasPermission}
                handleGoodsReceipt={handleGoodsReceipt}
                goodsInProductRef={goodsInProductRef}
                goodsInQuantityRef={goodsInQuantityRef}
                focusNextOnEnter={focusNextOnEnter}
                packagingTypes={packagingTypes}
                movementPackagingTypeId={movementPackagingTypeId}
                setMovementPackagingTypeId={setMovementPackagingTypeId}
                movementLoadCarrierTypeId={movementLoadCarrierTypeId}
                setMovementLoadCarrierTypeId={setMovementLoadCarrierTypeId}
                movementPackagingQuantity={movementPackagingQuantity}
                setMovementPackagingQuantity={setMovementPackagingQuantity}
                movementUnitPurchasePrice={movementUnitPurchasePrice}
                setMovementUnitPurchasePrice={setMovementUnitPurchasePrice}
                movementExpiryDate={movementExpiryDate}
                setMovementExpiryDate={setMovementExpiryDate}
              />
            )}

            {activeSection === "goods-out" && (
              <GoodsOutSection
                products={products}
                storageLocations={storageLocations}
                movements={movements}
                packagingTypes={packagingTypes}
                goodsOutProductId={goodsOutProductId}
                goodsOutStorageLocationId={goodsOutStorageLocationId}
                setGoodsOutStorageLocationId={setGoodsOutStorageLocationId}
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
                handleExportInventoryPdf={handleExportInventoryPdf}
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

                {activeSection === "stock-overview" && (
                  <LocationStockOverview
                    locationStocks={locationStocks}
                    loading={locationStocksLoading}
                    search={search}
                  exportLocationStocksToExcel={exportLocationStocksToExcel}
                />
                )}

                {activeSection !== "stock-overview" && loading && <p>Lade Produkte...</p>}
                {activeSection !== "stock-overview" && !loading && !error && visibleProducts.length === 0 && <p>Keine Produkte passen zur aktuellen Suche oder zum Filter.</p>}
                {activeSection !== "stock-overview" && !loading && !error && visibleProducts.length > 0 && (
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
  canWrite,
  onRemoveDraft,
  onApproveDraft,
}: {
  drafts: PurchaseOrderDraft[];
  canWrite: boolean;
  onRemoveDraft: (draftId: number) => void;
  onApproveDraft: (draftId: number) => void;
}) {
  const totalQuantity = drafts.reduce((sum, draft) => sum + draft.quantity, 0);
  const approvedCount = drafts.filter((draft) => draft.status === "APPROVED").length;

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
                    <td style={tableCellStyle}>{draft.orderNumber ?? "—"}</td>
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
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => onApproveDraft(draft.id)}
                          disabled={!canWrite || isApproved}
                          style={!canWrite || isApproved ? disabledButtonStyle : primaryButtonStyle}
                        >
                          {isApproved ? "Freigegeben" : canWrite ? "Freigeben" : "Nur ansehen"}
                        </button>

                        <button
                          type="button"
                          onClick={() => onRemoveDraft(draft.id)}
                          disabled={!canWrite}
                          style={canWrite ? secondaryButtonStyle : disabledButtonStyle}
                        >
                          {canWrite ? "Entfernen" : "Nur ansehen"}
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

function AdminUsersSection({
  users,
  loading,
  form,
  saving,
  canManage,
  onChange,
  onToggleActive,
  onToggleUserActive,
  onSubmit,
}: {
  users: AdminUser[];
  loading: boolean;
  form: AdminUserForm;
  saving: boolean;
  canManage: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onToggleActive: (checked: boolean) => void;
  onToggleUserActive: (
    userId: number,
    isActive: boolean,
    username: string
  ) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const activeUsers = users.filter((user) => user.is_active);

  const roleOptions = [
    { value: "viewer", label: "Viewer / Recruiter" },
    { value: "lager", label: "Lager" },
    { value: "einkauf", label: "Einkauf" },
    { value: "dispo", label: "Dispo" },
    { value: "admin", label: "Admin" },
  ];

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>👤 Benutzer anlegen</h2>

      <p style={infoStyle}>
        Benutzerverwaltung für Demo-Zugänge. Neue Benutzer können direkt mit
        Rolle und Aktiv/Inaktiv-Status angelegt werden. Bestehende Rollen werden
        hier nur angezeigt; ändern kannst du sie unter Rollen & Zugriffsrechte.
      </p>

      <div style={dashboardGridStyle}>
        <Card title="Benutzer gesamt" value={String(users.length)} />
        <Card title="Aktive Benutzer" value={String(activeUsers.length)} />
      </div>

      {canManage ? (
        <form
          onSubmit={onSubmit}
          style={{ ...formGridStyle, marginTop: "22px", marginBottom: "24px" }}
        >
          <input
            name="username"
            placeholder="Benutzername"
            value={form.username}
            onChange={onChange}
            style={inputStyle}
          />

          <input
            name="password"
            type="password"
            placeholder="Startpasswort"
            value={form.password}
            onChange={onChange}
            style={inputStyle}
          />

          <input
            name="email"
            placeholder="E-Mail"
            value={form.email}
            onChange={onChange}
            style={inputStyle}
          />

          <input
            name="first_name"
            placeholder="Vorname"
            value={form.first_name}
            onChange={onChange}
            style={inputStyle}
          />

          <input
            name="last_name"
            placeholder="Nachname"
            value={form.last_name}
            onChange={onChange}
            style={inputStyle}
          />

          <select
            name="role"
            value={form.role}
            onChange={onChange}
            style={inputStyle}
          >
            {roleOptions.map((roleOption) => (
              <option key={roleOption.value} value={roleOption.value}>
                {roleOption.label}
              </option>
            ))}
          </select>

          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => onToggleActive(event.target.checked)}
            />
            Benutzer aktiv anlegen
          </label>

          <button type="submit" disabled={saving} style={primaryButtonStyle}>
            {saving ? "Speichere..." : "Benutzer anlegen"}
          </button>
        </form>
      ) : (
        <p style={infoStyle}>
          Nur Admins dürfen Benutzer anlegen.
        </p>
      )}

      {loading && <p>Lade Benutzer...</p>}

      {!loading && users.length > 0 && (
        <div style={{ ...tableWrapStyle, marginTop: "22px" }}>
          <table style={dataTableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={tableHeadStyle}>Benutzername</th>
                <th style={tableHeadStyle}>Name</th>
                <th style={tableHeadStyle}>E-Mail</th>
                <th style={tableHeadStyle}>Rolle</th>
                <th style={tableHeadStyle}>Aktiv / Inaktiv</th>
                <th style={tableHeadStyle}>Staff</th>
                <th style={tableHeadStyle}>Erstellt</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  style={{
                    borderTop: "1px solid rgba(148, 163, 184, 0.12)",
                    background: user.is_active
                      ? "rgba(22,101,52,0.06)"
                      : "rgba(127,29,29,0.08)",
                  }}
                >
                  <td style={tableCellStyle}>{user.username}</td>

                  <td style={tableCellStyle}>
                    {[user.first_name, user.last_name].filter(Boolean).join(" ") ||
                      "—"}
                  </td>

                  <td style={tableCellStyle}>{user.email || "—"}</td>

                  <td style={tableCellStyle}>
                    <strong>{user.role}</strong>
                  </td>

                  <td style={tableCellStyle}>
                    <label style={checkboxLabelStyle}>
                      <input
                        type="checkbox"
                        checked={user.is_active}
                        disabled={!canManage}
                        onChange={(event) =>
                          onToggleUserActive(
                            user.id,
                            event.target.checked,
                            user.username
                          )
                        }
                      />
                      {user.is_active ? "Aktiv" : "Inaktiv"}
                    </label>
                  </td>

                  <td style={tableCellStyle}>{user.is_staff ? "✅ Ja" : "—"}</td>

                  <td style={tableCellStyle}>
                    {new Date(user.date_joined).toLocaleString("de-DE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && users.length === 0 && <p>Noch keine Benutzer vorhanden.</p>}
    </section>
  );
}


function RoleRightsSection({
  users,
  canManage,
  onChangeUserRole,
}: {
  users: AdminUser[];
  canManage: boolean;
  onChangeUserRole: (userId: number, newRole: string) => void;
}) {
  const roleOptions = [
    { value: "admin", label: "Admin" },
    { value: "lager", label: "Lager" },
    { value: "einkauf", label: "Einkauf" },
    { value: "dispo", label: "Dispo" },
    { value: "viewer", label: "Viewer / Recruiter" },
  ];

  const roleCounts = users.reduce<Record<string, number>>((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  const rights = [
    {
      role: "admin",
      label: "Admin",
      access:
        "Voller Zugriff auf alle Module, Benutzer, Rollen und Systemprotokoll.",
    },
    {
      role: "lager",
      label: "Lager",
      access:
        "Wareneingang, Warenausgang, Lagerorte, Lagerkorrekturen und Bewegungshistorie.",
    },
    {
      role: "einkauf",
      label: "Einkauf",
      access:
        "Einkauf, Lieferanten, Kundenstamm und Lagerkorrekturen nur lesend.",
    },
    {
      role: "dispo",
      label: "Dispo",
      access:
        "Dispo, Bestände, Mindestbestände, Nachbestellvorschläge und Inventuransicht.",
    },
    {
      role: "viewer",
      label: "Viewer / Recruiter",
      access: "Alle Bereiche ansehen, aber keine Schreib- oder Buchungsrechte.",
    },
  ];

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>🔐 Rollen & Zugriffsrechte</h2>

      <p style={infoStyle}>
        Rollen können hier direkt je Benutzer angepasst werden. Aktiv/Inaktiv
        wird ausschließlich unter „Benutzer anlegen“ gepflegt.
      </p>

      <div style={dashboardGridStyle}>
        <Card title="Rollen" value={String(rights.length)} />
        <Card title="Benutzer" value={String(users.length)} />
      </div>

      {!canManage && (
        <p style={infoStyle}>
          Nur Admins dürfen Rollen ändern. Diese Seite zeigt die aktuelle
          Rechte-Struktur lesend an.
        </p>
      )}

      <div style={{ ...tableWrapStyle, marginTop: "22px" }}>
        <table style={dataTableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={tableHeadStyle}>Rolle</th>
              <th style={tableHeadStyle}>Benutzer</th>
              <th style={tableHeadStyle}>Zugriffsrechte</th>
            </tr>
          </thead>

          <tbody>
            {rights.map((right) => (
              <tr
                key={right.role}
                style={{ borderTop: "1px solid rgba(148, 163, 184, 0.12)" }}
              >
                <td style={tableCellStyle}>
                  <strong>{right.label}</strong>
                </td>
                <td style={tableCellStyle}>{roleCounts[right.role] || 0}</td>
                <td style={tableCellStyle}>{right.access}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ color: "#bfdbfe", marginTop: "26px" }}>
        Benutzerrollen bearbeiten
      </h3>

      <div style={{ ...tableWrapStyle, marginTop: "14px" }}>
        <table style={dataTableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={tableHeadStyle}>Benutzer</th>
              <th style={tableHeadStyle}>Aktuelle Rolle</th>
              <th style={tableHeadStyle}>Neue Rolle</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                style={{
                  borderTop: "1px solid rgba(148, 163, 184, 0.12)",
                  background: user.is_active
                    ? "rgba(22,101,52,0.06)"
                    : "rgba(127,29,29,0.08)",
                }}
              >
                <td style={tableCellStyle}>
                  <strong>{user.username}</strong>
                  <br />
                  <span style={{ color: "#94a3b8" }}>
                    {[user.first_name, user.last_name].filter(Boolean).join(" ") ||
                      user.email ||
                      "—"}
                  </span>
                </td>

                <td style={tableCellStyle}>{user.role}</td>

                <td style={tableCellStyle}>
                  <select
                    value={user.role}
                    disabled={!canManage}
                    onChange={(event) =>
                      onChangeUserRole(user.id, event.target.value)
                    }
                    style={canManage ? inputStyle : disabledButtonStyle}
                  >
                    {roleOptions.map((roleOption) => (
                      <option key={roleOption.value} value={roleOption.value}>
                        {roleOption.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


function AuditLogSection({
  logs,
  loading,
  canView,
}: {
  logs: AuditLog[];
  loading: boolean;
  canView: boolean;
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>🧾 Systemprotokoll</h2>

      <p style={infoStyle}>
        Nachvollziehbarkeit wichtiger Admin-Aktionen wie Benutzeranlage und
        Rollenänderungen.
      </p>

      {!canView && (
        <p style={infoStyle}>
          Nur Admins dürfen das Systemprotokoll ansehen.
        </p>
      )}

      {canView && (
        <>
          <div style={dashboardGridStyle}>
            <Card title="Protokolleinträge" value={String(logs.length)} />
          </div>

          {loading && <p>Lade Systemprotokoll...</p>}

          {!loading && logs.length === 0 && (
            <p>Noch keine Protokolleinträge vorhanden.</p>
          )}

          {!loading && logs.length > 0 && (
            <div style={{ ...tableWrapStyle, marginTop: "22px" }}>
              <table style={dataTableStyle}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
                    <th style={tableHeadStyle}>Datum</th>
                    <th style={tableHeadStyle}>Bereich</th>
                    <th style={tableHeadStyle}>Aktion</th>
                    <th style={tableHeadStyle}>Objekt</th>
                    <th style={tableHeadStyle}>Meldung</th>
                    <th style={tableHeadStyle}>Benutzer</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      style={{ borderTop: "1px solid rgba(148, 163, 184, 0.12)" }}
                    >
                      <td style={tableCellStyle}>
                        {new Date(log.created_at).toLocaleString("de-DE")}
                      </td>
                      <td style={tableCellStyle}>{log.area}</td>
                      <td style={tableCellStyle}>{log.action}</td>
                      <td style={tableCellStyle}>
                        {log.object_type || "—"} {log.object_id || ""}
                      </td>
                      <td style={tableCellStyle}>{log.message}</td>
                      <td style={tableCellStyle}>
                        {log.created_by_username || "System"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}


function CustomersSection({
  customers,
  loading,
  form,
  saving,
  canManage,
  onChange,
  onToggleActive,
  onSubmit,
}: {
  customers: Customer[];
  loading: boolean;
  form: CustomerForm;
  saving: boolean;
  canManage: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onToggleActive: (checked: boolean) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const activeCustomers = customers.filter((customer) => customer.is_active);

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>👥 Kundenliste</h2>

      <p style={infoStyle}>
        Kundenstamm mit Kundennummer, Kontaktinformationen und Status.
      </p>

      <div style={dashboardGridStyle}>
        <Card title="Kunden gesamt" value={String(customers.length)} />
        <Card title="Aktive Kunden" value={String(activeCustomers.length)} />
      </div>

      {canManage ? (
        <form
          onSubmit={onSubmit}
          style={{ ...formGridStyle, marginTop: "22px", marginBottom: "24px" }}
        >
          <input name="name" placeholder="Kundenname" value={form.name} onChange={onChange} style={inputStyle} />
          <input name="customer_number" placeholder="Kundennummer" value={form.customer_number} onChange={onChange} style={inputStyle} />
          <input name="email" placeholder="E-Mail" value={form.email} onChange={onChange} style={inputStyle} />
          <input name="phone" placeholder="Telefon" value={form.phone} onChange={onChange} style={inputStyle} />
          <input name="street" placeholder="Straße" value={form.street} onChange={onChange} style={inputStyle} />
          <input name="postal_code" placeholder="PLZ" value={form.postal_code} onChange={onChange} style={inputStyle} />
          <input name="city" placeholder="Ort" value={form.city} onChange={onChange} style={inputStyle} />
          <input name="country" placeholder="Land" value={form.country} onChange={onChange} style={inputStyle} />

          <textarea
            name="note"
            placeholder="Notiz"
            value={form.note}
            onChange={onChange}
            style={{ ...inputStyle, minHeight: "80px", gridColumn: "1 / -1" }}
          />

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => onToggleActive(event.target.checked)}
          />
          Aktiv
        </label>

        <button type="submit" disabled={saving} style={primaryButtonStyle}>
          {saving ? "Speichere..." : "Lagerort anlegen"}
        </button>
        </form>
      ) : (
        <p style={infoStyle}>Nur-Lese-Modus: Kunden können angesehen, aber nicht angelegt oder bearbeitet werden.</p>
      )}

      {loading && <p>Lade Kunden...</p>}
      {!loading && customers.length === 0 && <p>Noch keine Kunden vorhanden.</p>}

      {!loading && customers.length > 0 && (
        <div style={{ ...tableWrapStyle, marginTop: "22px" }}>
          <table style={dataTableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={tableHeadStyle}>Name</th>
                <th style={tableHeadStyle}>Nummer</th>
                <th style={tableHeadStyle}>E-Mail</th>
                <th style={tableHeadStyle}>Telefon</th>
                <th style={tableHeadStyle}>Ort</th>
                <th style={tableHeadStyle}>Ansprechpartner</th>
                <th style={tableHeadStyle}>Lieferadressen</th>
                <th style={tableHeadStyle}>Notizen</th>
                <th style={tableHeadStyle}>Status</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  style={{
                    borderTop: "1px solid rgba(148, 163, 184, 0.12)",
                    background: customer.is_active ? "rgba(22,101,52,0.08)" : "rgba(127,29,29,0.08)",
                  }}
                >
                  <td style={tableCellStyle}>{customer.name}</td>
                  <td style={tableCellStyle}>{customer.customer_number || "—"}</td>
                  <td style={tableCellStyle}>{customer.email || "—"}</td>
                  <td style={tableCellStyle}>{customer.phone || "—"}</td>
                  <td style={tableCellStyle}>{customer.city || "—"}</td>
                  <td style={tableCellStyle}>{customer.contact_count}</td>
                  <td style={tableCellStyle}>{customer.delivery_address_count}</td>
                  <td style={tableCellStyle}>{customer.note_count}</td>
                  <td style={tableCellStyle}>{customer.is_active ? "✅ Aktiv" : "⛔ Inaktiv"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}


function CustomerContactsSection({
  customers,
  contacts,
  loading,
  form,
  saving,
  canManage,
  onChange,
  onTogglePrimary,
  onToggleActive,
  onSubmit,
}: {
  customers: Customer[];
  contacts: CustomerContact[];
  loading: boolean;
  form: CustomerContactForm;
  saving: boolean;
  canManage: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onTogglePrimary: (checked: boolean) => void;
  onToggleActive: (checked: boolean) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>☎️ Ansprechpartner</h2>

      <p style={infoStyle}>Ansprechpartner je Kunde mit Rolle, Telefon und E-Mail.</p>

      <div style={dashboardGridStyle}>
        <Card title="Ansprechpartner" value={String(contacts.length)} />
        <Card title="Primäre Kontakte" value={String(contacts.filter((contact) => contact.is_primary).length)} />
      </div>

      {canManage ? (
        <form onSubmit={onSubmit} style={{ ...formGridStyle, marginTop: "22px", marginBottom: "24px" }}>
          <select name="customer" value={form.customer} onChange={onChange} style={inputStyle}>
            <option value="">Kunde auswählen</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>

          <input name="first_name" placeholder="Vorname" value={form.first_name} onChange={onChange} style={inputStyle} />
          <input name="last_name" placeholder="Nachname" value={form.last_name} onChange={onChange} style={inputStyle} />
          <input name="role" placeholder="Funktion / Rolle" value={form.role} onChange={onChange} style={inputStyle} />
          <input name="email" placeholder="E-Mail" value={form.email} onChange={onChange} style={inputStyle} />
          <input name="phone" placeholder="Telefon" value={form.phone} onChange={onChange} style={inputStyle} />
          <input name="mobile" placeholder="Mobil" value={form.mobile} onChange={onChange} style={inputStyle} />

          <label style={checkboxLabelStyle}>
            <input type="checkbox" checked={form.is_primary} onChange={(event) => onTogglePrimary(event.target.checked)} />
            Hauptkontakt
          </label>

          <label style={checkboxLabelStyle}>
            <input type="checkbox" checked={form.is_active} onChange={(event) => onToggleActive(event.target.checked)} />
            Aktiv
          </label>

          <textarea name="note" placeholder="Notiz" value={form.note} onChange={onChange} style={{ ...inputStyle, minHeight: "80px", gridColumn: "1 / -1" }} />

          <button type="submit" disabled={saving} style={primaryButtonStyle}>
            {saving ? "Speichere..." : "Ansprechpartner anlegen"}
          </button>
        </form>
      ) : (
        <p style={infoStyle}>Nur-Lese-Modus: Ansprechpartner können angesehen, aber nicht angelegt werden.</p>
      )}

      {loading && <p>Lade Ansprechpartner...</p>}

      {!loading && contacts.length > 0 && (
        <div style={{ ...tableWrapStyle, marginTop: "22px" }}>
          <table style={dataTableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={tableHeadStyle}>Kunde</th>
                <th style={tableHeadStyle}>Name</th>
                <th style={tableHeadStyle}>Rolle</th>
                <th style={tableHeadStyle}>E-Mail</th>
                <th style={tableHeadStyle}>Telefon</th>
                <th style={tableHeadStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} style={{ borderTop: "1px solid rgba(148, 163, 184, 0.12)" }}>
                  <td style={tableCellStyle}>{contact.customer_name}</td>
                  <td style={tableCellStyle}>{`${contact.first_name} ${contact.last_name}`.trim()}</td>
                  <td style={tableCellStyle}>{contact.role || "—"}</td>
                  <td style={tableCellStyle}>{contact.email || "—"}</td>
                  <td style={tableCellStyle}>{contact.phone || contact.mobile || "—"}</td>
                  <td style={tableCellStyle}>{contact.is_primary ? "⭐ Hauptkontakt" : contact.is_active ? "✅ Aktiv" : "⛔ Inaktiv"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && contacts.length === 0 && <p>Noch keine Ansprechpartner vorhanden.</p>}
    </section>
  );
}


function DeliveryAddressesSection({
  customers,
  addresses,
  loading,
  form,
  saving,
  canManage,
  onChange,
  onToggleDefault,
  onToggleActive,
  onSubmit,
}: {
  customers: Customer[];
  addresses: DeliveryAddress[];
  loading: boolean;
  form: DeliveryAddressForm;
  saving: boolean;
  canManage: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onToggleDefault: (checked: boolean) => void;
  onToggleActive: (checked: boolean) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>📦 Lieferadressen</h2>

      <p style={infoStyle}>Abweichende Lieferadressen und Standardadressen je Kunde.</p>

      <div style={dashboardGridStyle}>
        <Card title="Lieferadressen" value={String(addresses.length)} />
        <Card title="Standardadressen" value={String(addresses.filter((address) => address.is_default).length)} />
      </div>

      {canManage ? (
        <form onSubmit={onSubmit} style={{ ...formGridStyle, marginTop: "22px", marginBottom: "24px" }}>
          <select name="customer" value={form.customer} onChange={onChange} style={inputStyle}>
            <option value="">Kunde auswählen</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>

          <input name="label" placeholder="Bezeichnung z. B. Werk 1" value={form.label} onChange={onChange} style={inputStyle} />
          <input name="recipient_name" placeholder="Empfängername" value={form.recipient_name} onChange={onChange} style={inputStyle} />
          <input name="street" placeholder="Straße" value={form.street} onChange={onChange} style={inputStyle} />
          <input name="postal_code" placeholder="PLZ" value={form.postal_code} onChange={onChange} style={inputStyle} />
          <input name="city" placeholder="Ort" value={form.city} onChange={onChange} style={inputStyle} />
          <input name="country" placeholder="Land" value={form.country} onChange={onChange} style={inputStyle} />

          <label style={checkboxLabelStyle}>
            <input type="checkbox" checked={form.is_default} onChange={(event) => onToggleDefault(event.target.checked)} />
            Standardadresse
          </label>

          <label style={checkboxLabelStyle}>
            <input type="checkbox" checked={form.is_active} onChange={(event) => onToggleActive(event.target.checked)} />
            Aktiv
          </label>

          <textarea name="note" placeholder="Notiz" value={form.note} onChange={onChange} style={{ ...inputStyle, minHeight: "80px", gridColumn: "1 / -1" }} />

          <button type="submit" disabled={saving} style={primaryButtonStyle}>
            {saving ? "Speichere..." : "Lieferadresse anlegen"}
          </button>
        </form>
      ) : (
        <p style={infoStyle}>Nur-Lese-Modus: Lieferadressen können angesehen, aber nicht angelegt werden.</p>
      )}

      {loading && <p>Lade Lieferadressen...</p>}

      {!loading && addresses.length > 0 && (
        <div style={{ ...tableWrapStyle, marginTop: "22px" }}>
          <table style={dataTableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={tableHeadStyle}>Kunde</th>
                <th style={tableHeadStyle}>Bezeichnung</th>
                <th style={tableHeadStyle}>Empfänger</th>
                <th style={tableHeadStyle}>Straße</th>
                <th style={tableHeadStyle}>PLZ</th>
                <th style={tableHeadStyle}>Ort</th>
                <th style={tableHeadStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {addresses.map((address) => (
                <tr key={address.id} style={{ borderTop: "1px solid rgba(148, 163, 184, 0.12)" }}>
                  <td style={tableCellStyle}>{address.customer_name}</td>
                  <td style={tableCellStyle}>{address.label}</td>
                  <td style={tableCellStyle}>{address.recipient_name || "—"}</td>
                  <td style={tableCellStyle}>{address.street}</td>
                  <td style={tableCellStyle}>{address.postal_code}</td>
                  <td style={tableCellStyle}>{address.city}</td>
                  <td style={tableCellStyle}>{address.is_default ? "⭐ Standard" : address.is_active ? "✅ Aktiv" : "⛔ Inaktiv"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && addresses.length === 0 && <p>Noch keine Lieferadressen vorhanden.</p>}
    </section>
  );
}


function CustomerNotesSection({
  customers,
  notes,
  loading,
  form,
  saving,
  canManage,
  onChange,
  onSubmit,
}: {
  customers: Customer[];
  notes: CustomerNote[];
  loading: boolean;
  form: CustomerNoteForm;
  saving: boolean;
  canManage: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>📝 Kundennotizen</h2>

      <p style={infoStyle}>Interne Notizen, Hinweise und Gesprächsvermerke je Kunde.</p>

      <div style={dashboardGridStyle}>
        <Card title="Notizen gesamt" value={String(notes.length)} />
        <Card title="Kunden mit Notizen" value={String(new Set(notes.map((note) => note.customer)).size)} />
      </div>

      {canManage ? (
        <form onSubmit={onSubmit} style={{ ...formGridStyle, marginTop: "22px", marginBottom: "24px" }}>
          <select name="customer" value={form.customer} onChange={onChange} style={inputStyle}>
            <option value="">Kunde auswählen</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>

          <input name="title" placeholder="Titel" value={form.title} onChange={onChange} style={inputStyle} />

          <textarea name="note" placeholder="Notiz" value={form.note} onChange={onChange} style={{ ...inputStyle, minHeight: "100px", gridColumn: "1 / -1" }} />

          <button type="submit" disabled={saving} style={primaryButtonStyle}>
            {saving ? "Speichere..." : "Kundennotiz anlegen"}
          </button>
        </form>
      ) : (
        <p style={infoStyle}>Nur-Lese-Modus: Kundennotizen können angesehen, aber nicht angelegt werden.</p>
      )}

      {loading && <p>Lade Kundennotizen...</p>}

      {!loading && notes.length > 0 && (
        <div style={{ ...tableWrapStyle, marginTop: "22px" }}>
          <table style={dataTableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={tableHeadStyle}>Datum</th>
                <th style={tableHeadStyle}>Kunde</th>
                <th style={tableHeadStyle}>Titel</th>
                <th style={tableHeadStyle}>Notiz</th>
                <th style={tableHeadStyle}>Erstellt von</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note) => (
                <tr key={note.id} style={{ borderTop: "1px solid rgba(148, 163, 184, 0.12)" }}>
                  <td style={tableCellStyle}>{new Date(note.created_at).toLocaleString("de-DE")}</td>
                  <td style={tableCellStyle}>{note.customer_name}</td>
                  <td style={tableCellStyle}>{note.title}</td>
                  <td style={tableCellStyle}>{note.note}</td>
                  <td style={tableCellStyle}>{note.created_by_username || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && notes.length === 0 && <p>Noch keine Kundennotizen vorhanden.</p>}
    </section>
  );
}


function StockCorrectionsSection({
  products,
  selectedProduct,
  correctionProductId,
  setCorrectionProductId,
  correctionTargetQuantity,
  setCorrectionTargetQuantity,
  correctionReference,
  setCorrectionReference,
  correctionReason,
  setCorrectionReason,
  correctionSaving,
  correctionMovements,
  canManage,
  onSubmit,
}: {
  products: Product[];
  selectedProduct: Product | null;
  correctionProductId: string;
  setCorrectionProductId: (value: string) => void;
  correctionTargetQuantity: string;
  setCorrectionTargetQuantity: (value: string) => void;
  correctionReference: string;
  setCorrectionReference: (value: string) => void;
  correctionReason: string;
  setCorrectionReason: (value: string) => void;
  correctionSaving: boolean;
  correctionMovements: StockMovement[];
  canManage: boolean;
  onSubmit: (event: FormEvent) => void;
}) {
  const targetQuantity =
    correctionTargetQuantity === "" ? null : Number(correctionTargetQuantity);

  const difference =
    selectedProduct && targetQuantity !== null
      ? targetQuantity - selectedProduct.quantity
      : null;

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>🔧 Lagerkorrekturen</h2>

      <p style={infoStyle}>
        Manuelle Lagerkorrekturen mit Begründung und Bewegungshistorie. Die
        Korrektur wird als Wareneingang oder Warenausgang gebucht und bleibt in
        der Historie nachvollziehbar.
      </p>

      <div style={dashboardGridStyle}>
        <Card title="Korrekturbuchungen" value={String(correctionMovements.length)} />
        <Card
          title="Aktuelle Differenz"
          value={difference === null ? "—" : difference > 0 ? `+${difference}` : String(difference)}
          danger={difference !== null && difference !== 0}
        />
      </div>

      {canManage ? (
        <form
          onSubmit={onSubmit}
          style={{ ...formGridStyle, marginTop: "22px", marginBottom: "24px" }}
        >
          <select
            value={correctionProductId}
            onChange={(event) => setCorrectionProductId(event.target.value)}
            style={inputStyle}
          >
            <option value="">Produkt auswählen</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku}) - aktuell: {product.quantity} {product.unit}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            placeholder="Neuer Zielbestand"
            value={correctionTargetQuantity}
            onChange={(event) => setCorrectionTargetQuantity(event.target.value)}
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Referenz z. B. KORR-2026-001"
            value={correctionReference}
            onChange={(event) => setCorrectionReference(event.target.value)}
            style={inputStyle}
          />

          <textarea
            placeholder="Begründung der Lagerkorrektur"
            value={correctionReason}
            onChange={(event) => setCorrectionReason(event.target.value)}
            style={{
              ...inputStyle,
              minHeight: "80px",
              gridColumn: "1 / -1",
            }}
          />

          {selectedProduct && (
            <p style={{ ...infoStyle, gridColumn: "1 / -1" }}>
              Produkt: <strong>{selectedProduct.name}</strong> | Aktueller Bestand:{" "}
              <strong>{selectedProduct.quantity} {selectedProduct.unit}</strong>
              {difference !== null && (
                <>
                  {" "} | Differenz:{" "}
                  <strong>{difference > 0 ? `+${difference}` : difference}</strong>
                </>
              )}
            </p>
          )}

          <button
            type="submit"
            disabled={correctionSaving}
            style={primaryButtonStyle}
          >
            {correctionSaving ? "Buche..." : "Lagerkorrektur buchen"}
          </button>
        </form>
      ) : (
        <p style={infoStyle}>
          Nur-Lese-Modus: Lagerkorrekturen können angesehen, aber nicht gebucht
          werden.
        </p>
      )}

      {correctionMovements.length === 0 ? (
        <p>Noch keine Lagerkorrekturen vorhanden.</p>
      ) : (
        <div style={{ ...tableWrapStyle, marginTop: "22px" }}>
          <table style={dataTableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={tableHeadStyle}>Datum</th>
                <th style={tableHeadStyle}>Produkt</th>
                <th style={tableHeadStyle}>Typ</th>
                <th style={tableHeadStyle}>Menge</th>
                <th style={tableHeadStyle}>Referenz</th>
                <th style={tableHeadStyle}>Begründung</th>
                <th style={tableHeadStyle}>Benutzer</th>
              </tr>
            </thead>

            <tbody>
              {correctionMovements.map((movement) => {
                const isIn = movement.movement_type === "IN";

                return (
                  <tr
                    key={movement.id}
                    style={{
                      borderTop: "1px solid rgba(148, 163, 184, 0.12)",
                      background: isIn
                        ? "rgba(22,101,52,0.08)"
                        : "rgba(127,29,29,0.08)",
                    }}
                  >
                    <td style={tableCellStyle}>
                      {new Date(movement.created_at).toLocaleString("de-DE")}
                    </td>
                    <td style={tableCellStyle}>{movement.product_name}</td>
                    <td style={tableCellStyle}>
                      {isIn ? "Bestandserhöhung" : "Bestandsreduzierung"}
                    </td>
                    <td style={tableCellStyle}>
                      {isIn ? "+" : "-"}{movement.quantity}
                    </td>
                    <td style={tableCellStyle}>{movement.reference_number || "—"}</td>
                    <td style={tableCellStyle}>{movement.note || "—"}</td>
                    <td style={tableCellStyle}>
                      {movement.created_by_username || "—"}
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

function SuppliersSection({
  suppliers,
  loading,
  form,
  saving,
  canManage,
  onChange,
  onToggleActive,
  onSubmit,
}: {
  suppliers: Supplier[];
  loading: boolean;
  form: SupplierForm;
  saving: boolean;
  canManage: boolean;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onToggleActive: (checked: boolean) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const activeSuppliers = suppliers.filter((supplier) => supplier.is_active);

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>🚚 Lieferanten</h2>

      <p style={infoStyle}>
        Verwaltung von Lieferanten, Ansprechpartnern und Kontaktdaten für den
        Einkaufsprozess.
      </p>

      <div style={dashboardGridStyle}>
        <Card title="Lieferanten gesamt" value={String(suppliers.length)} />
        <Card title="Aktive Lieferanten" value={String(activeSuppliers.length)} />
      </div>

      {canManage && (
        <form
          onSubmit={onSubmit}
          style={{ ...formGridStyle, marginTop: "22px", marginBottom: "24px" }}
        >
          <input
            name="name"
            placeholder="Lieferantenname"
            value={form.name}
            onChange={onChange}
            style={inputStyle}
          />

          <input
            name="supplier_number"
            placeholder="Lieferantennummer"
            value={form.supplier_number}
            onChange={onChange}
            style={inputStyle}
          />

          <input
            name="contact_person"
            placeholder="Ansprechpartner"
            value={form.contact_person}
            onChange={onChange}
            style={inputStyle}
          />

          <input
            name="email"
            placeholder="E-Mail"
            value={form.email}
            onChange={onChange}
            style={inputStyle}
          />

          <input
            name="phone"
            placeholder="Telefon"
            value={form.phone}
            onChange={onChange}
            style={inputStyle}
          />

          <input
            name="street"
            placeholder="Straße"
            value={form.street}
            onChange={onChange}
            style={inputStyle}
          />

          <input
            name="postal_code"
            placeholder="PLZ"
            value={form.postal_code}
            onChange={onChange}
            style={inputStyle}
          />

          <input
            name="city"
            placeholder="Ort"
            value={form.city}
            onChange={onChange}
            style={inputStyle}
          />

          <input
            name="country"
            placeholder="Land"
            value={form.country}
            onChange={onChange}
            style={inputStyle}
          />

          <textarea
            name="note"
            placeholder="Notiz"
            value={form.note}
            onChange={onChange}
            style={{
              ...inputStyle,
              minHeight: "80px",
              gridColumn: "1 / -1",
            }}
          />

          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => onToggleActive(event.target.checked)}
            />
            Aktiv
          </label>

          <button type="submit" disabled={saving} style={primaryButtonStyle}>
            {saving ? "Speichere..." : "Lieferant anlegen"}
          </button>
        </form>
      )}

      {!canManage && (
        <p style={infoStyle}>
          Nur-Lese-Modus: Lieferanten können angesehen, aber nicht angelegt oder
          bearbeitet werden.
        </p>
      )}

      {loading && <p>Lade Lieferanten...</p>}

      {!loading && suppliers.length === 0 && (
        <p>Noch keine Lieferanten vorhanden.</p>
      )}

      {!loading && suppliers.length > 0 && (
        <div style={{ ...tableWrapStyle, marginTop: "22px" }}>
          <table style={dataTableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={tableHeadStyle}>Name</th>
                <th style={tableHeadStyle}>Nummer</th>
                <th style={tableHeadStyle}>Ansprechpartner</th>
                <th style={tableHeadStyle}>E-Mail</th>
                <th style={tableHeadStyle}>Telefon</th>
                <th style={tableHeadStyle}>Ort</th>
                <th style={tableHeadStyle}>Status</th>
              </tr>
            </thead>

            <tbody>
              {suppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  style={{
                    borderTop: "1px solid rgba(148, 163, 184, 0.12)",
                    background: supplier.is_active
                      ? "rgba(22,101,52,0.08)"
                      : "rgba(127,29,29,0.08)",
                  }}
                >
                  <td style={tableCellStyle}>{supplier.name}</td>
                  <td style={tableCellStyle}>{supplier.supplier_number || "—"}</td>
                  <td style={tableCellStyle}>{supplier.contact_person || "—"}</td>
                  <td style={tableCellStyle}>{supplier.email || "—"}</td>
                  <td style={tableCellStyle}>{supplier.phone || "—"}</td>
                  <td style={tableCellStyle}>{supplier.city || "—"}</td>
                  <td style={tableCellStyle}>
                    {supplier.is_active ? "✅ Aktiv" : "⛔ Inaktiv"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StorageLocationsSection({
  title,
  locations,
  loading,
  form,
  saving,
  canManage,
  onChange,
  onToggleActive,
  onSubmit,
}: {
  title: string;
  locations: StorageLocation[];
  loading: boolean;
  form: StorageLocationForm;
  saving: boolean;
  canManage: boolean;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onToggleActive: (checked: boolean) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const activeLocations = locations.filter((location) => location.is_active);
  const emptyLocations = locations.filter((location) => location.is_empty);
  const blockedLocations = locations.filter((location) => location.is_blocked);

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}> {title}</h2>

      <p style={infoStyle}>
        Verwaltung von Lagerorten, Regalen, Fächern, Kapazitäten und Status.
      </p>

      <div style={dashboardGridStyle}>
        <Card title="Lagerorte gesamt" value={String(locations.length)} />
        <Card title="Aktive Lagerorte" value={String(activeLocations.length)} />
        <Card title="Freie Plätze" value={String(emptyLocations.length)} />
        <Card title="Gesperrte Plätze" value={String(blockedLocations.length)} danger={blockedLocations.length > 0} />
      </div>

      {canManage && (
        <form
          onSubmit={onSubmit}
          style={{
            marginTop: "24px",
            marginBottom: "28px",
            padding: "22px",
            borderRadius: "22px",
            background: "rgba(15, 23, 42, 0.82)",
            border: "1px solid rgba(148, 163, 184, 0.18)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#f8fafc" }}>
            Neuen Lagerort anlegen
          </h3>

          <div style={formGridStyle}>
            <input
              name="code"
              placeholder="Code z. B. A-R2-F4"
              value={form.code}
              onChange={onChange}
              style={inputStyle}
            />

            <input
              name="name"
              placeholder="Name z. B. Lager A"
              value={form.name}
              onChange={onChange}
              style={inputStyle}
            />

            <input
              name="zone"
              placeholder="Zone"
              value={form.zone}
              onChange={onChange}
              style={inputStyle}
            />

            <input
              name="aisle"
              placeholder="Gang"
              value={form.aisle}
              onChange={onChange}
              style={inputStyle}
            />

            <input
              name="rack"
              placeholder="Regal"
              value={form.rack}
              onChange={onChange}
              style={inputStyle}
            />

            <input
              name="shelf"
              placeholder="Fach"
              value={form.shelf}
              onChange={onChange}
              style={inputStyle}
            />

            <input
              name="length_cm"
              placeholder="Länge cm"
              value={form.length_cm}
              onChange={onChange}
              style={inputStyle}
            />

            <input
              name="width_cm"
              placeholder="Breite cm"
              value={form.width_cm}
              onChange={onChange}
              style={inputStyle}
            />

            <input
              name="height_cm"
              placeholder="Höhe cm"
              value={form.height_cm}
              onChange={onChange}
              style={inputStyle}
            />

            <input
              name="max_weight_kg"
              placeholder="Max. Gewicht kg"
              value={form.max_weight_kg}
              onChange={onChange}
              style={inputStyle}
            />

            <textarea
              name="description"
              placeholder="Beschreibung"
              value={form.description}
              onChange={onChange}
              style={{
                ...inputStyle,
                minHeight: "80px",
                gridColumn: "1 / -1",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", marginTop: "18px" }}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => onToggleActive(event.target.checked)}
              />
              Aktiv
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{ ...primaryButtonStyle, marginTop: "20px" }}
          >
            {saving ? "Speichere..." : "Lagerort anlegen"}
          </button>
        </form>
      )}

      {!canManage && (
        <p style={infoStyle}>
          Nur-Lese-Modus: Lagerorte können angesehen, aber nicht angelegt werden.
        </p>
      )}

      {loading && <p>Lade Lagerorte...</p>}

      {!loading && locations.length === 0 && (
        <p>Noch keine Lagerorte vorhanden.</p>
      )}

      {!loading && locations.length > 0 && (
        <div style={{ ...tableWrapStyle, marginTop: "22px" }}>
          <table style={dataTableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={tableHeadStyle}>Code</th>
                <th style={tableHeadStyle}>Name</th>
                <th style={tableHeadStyle}>Zone</th>
                <th style={tableHeadStyle}>Gang</th>
                <th style={tableHeadStyle}>Regal</th>
                <th style={tableHeadStyle}>Fach</th>
                <th style={tableHeadStyle}>Maße</th>
                <th style={tableHeadStyle}>Max. kg</th>
                <th style={tableHeadStyle}>Produkte</th>
                <th style={tableHeadStyle}>Status</th>
              </tr>
            </thead>

            <tbody>
              {locations.map((location) => (
                <tr
                  key={location.id}
                  style={{
                    borderTop: "1px solid rgba(148, 163, 184, 0.12)",
                    background: location.is_blocked
                      ? "rgba(127,29,29,0.12)"
                      : location.is_empty
                      ? "rgba(22,101,52,0.10)"
                      : "rgba(30,64,175,0.10)",
                  }}
                >
                  <td style={tableCellStyle}>{location.code}</td>
                  <td style={tableCellStyle}>{location.name}</td>
                  <td style={tableCellStyle}>{location.zone || "—"}</td>
                  <td style={tableCellStyle}>{location.aisle || "—"}</td>
                  <td style={tableCellStyle}>{location.rack || "—"}</td>
                  <td style={tableCellStyle}>{location.shelf || "—"}</td>
                  <td style={tableCellStyle}>
                    {location.length_cm || location.width_cm || location.height_cm
                      ? `${location.length_cm || "?"} × ${location.width_cm || "?"} × ${location.height_cm || "?"} cm`
                      : "—"}
                  </td>
                  <td style={tableCellStyle}>{location.max_weight_kg || "—"}</td>
                  <td style={tableCellStyle}>{location.product_count}</td>
                  <td style={tableCellStyle}>
                    {location.is_blocked
                      ? "⛔ Gesperrt"
                      : location.is_active
                      ? location.is_empty
                        ? "✅ Frei"
                        : "📦 Belegt"
                      : "⚪ Inaktiv"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
  storageLocations,
  packagingTypes,
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
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  setForm: Dispatch<SetStateAction<ProductForm>>;
  storageLocations: StorageLocation[];
  packagingTypes: PackagingType[];
  productNameRef: RefObject<HTMLInputElement | null>;
  productSkuRef: RefObject<HTMLInputElement | null>;
  productQuantityRef: RefObject<HTMLInputElement | null>;
  productMinStockRef: RefObject<HTMLInputElement | null>;
  productUnitRef: RefObject<HTMLSelectElement | null>;
  productDescriptionRef: RefObject<HTMLTextAreaElement | null>;
  focusNextOnEnter: (
    event: KeyboardEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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

        <input
          name="weight_kg"
          type="number"
          step="0.01"
          min="0"
          placeholder="Produktgewicht kg pro Stück"
          value={form.weight_kg}
          onChange={handleChange}
          style={inputStyle}
          disabled={!hasPermission("admin")}
        />

        <select
          value={form.putaway_strategy}
          onChange={(event) =>
            setForm({ ...form, putaway_strategy: event.target.value })
          }
          style={inputStyle}
          disabled={!hasPermission("admin")}
        >
          <option value="EMPTY_BIN">Einlagerstrategie: Leerplatzsuche</option>
          <option value="FIXED_BIN">Einlagerstrategie: Festplatz</option>
          <option value="ADD_TO_STOCK">Einlagerstrategie: Zulagerung</option>
        </select>

        <select
          value={form.fixed_storage_location}
          onChange={(event) =>
            setForm({ ...form, fixed_storage_location: event.target.value })
          }
          style={inputStyle}
          disabled={!hasPermission("admin")}
        >
          <option value="">Kein Festplatz</option>
          {storageLocations
            .filter((location) => location.is_active)
            .map((location) => (
              <option key={location.id} value={location.id}>
                {location.code} - {location.name}
                {location.rack ? ` / Regal ${location.rack}` : ""}
                {location.shelf ? ` / Fach ${location.shelf}` : ""}
              </option>
            ))}
        </select>

        <select
          value={form.removal_strategy}
          onChange={(event) =>
            setForm({ ...form, removal_strategy: event.target.value })
          }
          style={inputStyle}
          disabled={!hasPermission("admin")}
        >
          <option value="FIFO">Auslagerstrategie: FIFO</option>
          <option value="LIFO">Auslagerstrategie: LIFO</option>
          <option value="FEFO">Auslagerstrategie: FEFO</option>
          <option value="HIFO">Auslagerstrategie: HIFO</option>
          <option value="LOFO">Auslagerstrategie: LOFO</option>
        </select>

        <select
          value={form.storage_location}
          onChange={(event) =>
            setForm({ ...form, storage_location: event.target.value })
          }
          style={inputStyle}
          disabled={!hasPermission("admin")}
        >
          <option value="">Kein Lagerort</option>
          {storageLocations
            .filter((location) => location.is_active)
            .map((location) => (
              <option key={location.id} value={location.id}>
                {location.code} - {location.name}
                {location.rack ? ` / Regal ${location.rack}` : ""}
                {location.shelf ? ` / Fach ${location.shelf}` : ""}
              </option>
            ))}
        </select>
        <select
          value={form.packaging_type}
          onChange={(event) =>
            setForm({
              ...form,
              packaging_type: event.target.value,
            })
          }
          style={inputStyle}
          disabled={!hasPermission("admin")}
        >
          <option value="">Verpackungsart auswählen</option>

          {packagingTypes
            .filter((packagingType) => packagingType.is_active)
            .map((packagingType) => (
              <option
                key={packagingType.id}
                value={packagingType.id}
              >
                {packagingType.name}
              </option>
            ))}
        </select>

        <textarea ref={productDescriptionRef} name="description" placeholder="Beschreibung" value={form.description} onChange={handleChange} style={{ ...inputStyle, minHeight: "100px", gridColumn: "1 / -1" }} disabled={!hasPermission("admin")} />
        <button type="submit" disabled={saving || !hasPermission("admin")} style={hasPermission("admin") ? { ...primaryButtonStyle, gridColumn: "1 / -1" } : { ...primaryButtonStyle, gridColumn: "1 / -1", opacity: 0.4, cursor: "not-allowed" }}>
          {saving ? "Speichere..." : editingId ? "Produkt aktualisieren" : "Produkt speichern"}
        </button>
      </form>
    </section>
  );
}

function ReorderSection({
  suggestions,
  draftedProductIds,
  canWrite,
  onCreateOrderDraft,
}: {
  suggestions: ReorderSuggestion[];
  draftedProductIds: Set<number>;
  canWrite: boolean;
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
                    <td style={tableCellStyle}>{product.quantity} {product.unit}</td>
                    <td style={tableCellStyle}>{product.min_stock} {product.unit}</td>
                    <td style={tableCellStyle}>{product.targetStock} {product.unit}</td>
                    <td style={{ ...tableCellStyle, color: "#e76262", fontWeight: 700 }}>
                      +{product.suggestedQuantity} {product.unit}
                    </td>
                    <td style={tableCellStyle}>{product.unit}</td>
                    <td style={tableCellStyle}>
                      {isSentToPurchasing ? "📨 An Einkauf gesendet" : "⚠️ Nachbestellen"}
                    </td>
                    <td style={tableCellStyle}>
                      <button
                        type="button"
                        onClick={() => onCreateOrderDraft(product)}
                        disabled={isSentToPurchasing || !canWrite}
                        style={isSentToPurchasing || !canWrite ? disabledButtonStyle : secondaryButtonStyle}
                      >
                        {isSentToPurchasing
                          ? "An Einkauf gesendet"
                          : canWrite
                          ? "Bestellung vorbereiten"
                          : "Nur ansehen"}
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

function GoodsInSection({
  movementStorageLocationId,
  setMovementStorageLocationId,
  products,
  storageLocations,
  packagingTypes,
  movementProductId,
  setMovementProductId,
  movementQuantity,
  setMovementQuantity,
  movementReferenceNumber,
  setMovementReferenceNumber,
  movementNote,
  setMovementNote,
  movementPackagingTypeId,
  setMovementPackagingTypeId,
  movementLoadCarrierTypeId,
  setMovementLoadCarrierTypeId,
  movementPackagingQuantity,
  setMovementPackagingQuantity,
  movementUnitPurchasePrice,
  setMovementUnitPurchasePrice,
  movementExpiryDate,
  setMovementExpiryDate,
  movementSaving,
  hasPermission,
  handleGoodsReceipt,
  goodsInProductRef,
  goodsInQuantityRef,
  focusNextOnEnter,
}: {
  products: Product[];
  movementStorageLocationId: string;
  setMovementStorageLocationId: (value: string) => void;
  storageLocations: StorageLocation[];
  packagingTypes: PackagingType[];
  movementProductId: string;
  setMovementProductId: (value: string) => void;
  movementQuantity: string;
  setMovementQuantity: (value: string) => void;
  movementReferenceNumber: string;
  setMovementReferenceNumber: (value: string) => void;
  movementNote: string;
  setMovementNote: (value: string) => void;
  movementPackagingTypeId: string;
  setMovementPackagingTypeId: (value: string) => void;
  movementLoadCarrierTypeId: string;
  setMovementLoadCarrierTypeId: (value: string) => void;
  movementPackagingQuantity: string;
  setMovementPackagingQuantity: (value: string) => void;
  movementUnitPurchasePrice: string;
  setMovementUnitPurchasePrice: (value: string) => void;
  movementExpiryDate: string;
  setMovementExpiryDate: (value: string) => void;
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

  const selectedProduct =
    products.find((product) => String(product.id) === movementProductId) ?? null;

  const selectedPackagingType =
    packagingTypes.find(
      (packagingType) => String(packagingType.id) === movementPackagingTypeId
    ) ?? null;

  const selectedLoadCarrierType =
    packagingTypes.find(
      (packagingType) => String(packagingType.id) === movementLoadCarrierTypeId
    ) ?? null;

  const packagingQuantityForCheck = Math.max(
    1,
    Number(movementPackagingQuantity || 1)
  );

  type CapacityItem = {
    length_cm?: string | number | null;
    width_cm?: string | number | null;
    height_cm?: string | number | null;
    weight_kg?: string | number | null;
    max_weight_kg?: string | number | null;
  };

  const toPositiveNumber = (value?: string | number | null) => {
    const numberValue = Number(value ?? 0);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
  };

  const getVolumeCm3 = (item?: CapacityItem | null) => {
    const length = toPositiveNumber(item?.length_cm);
    const width = toPositiveNumber(item?.width_cm);
    const height = toPositiveNumber(item?.height_cm);

    if (length && width && height) {
      return length * width * height;
    }

    return null;
  };

  const packagingVolume = getVolumeCm3(selectedPackagingType);
  const loadCarrierVolume = getVolumeCm3(selectedLoadCarrierType);

  const requiredVolume =
    (packagingVolume !== null ? packagingVolume * packagingQuantityForCheck : 0) +
    (loadCarrierVolume !== null ? loadCarrierVolume : 0);

  const productWeight = toPositiveNumber(selectedProduct?.weight_kg);
  const goodsInQuantityForCheck = Math.max(1, Number(movementQuantity || 1));
  const packagingWeight = toPositiveNumber(selectedPackagingType?.weight_kg);
  const loadCarrierWeight = toPositiveNumber(selectedLoadCarrierType?.weight_kg);

  const requiredWeight =
    (productWeight !== null ? productWeight * goodsInQuantityForCheck : 0) +
    (packagingWeight !== null ? packagingWeight * packagingQuantityForCheck : 0) +
    (loadCarrierWeight !== null ? loadCarrierWeight : 0);

  const capacityNeedsCheck = requiredVolume > 0 || requiredWeight > 0;

  const isLocationAvailableForProduct = (
    location: StorageLocation,
    product?: Product | null
  ) =>
    location.is_active &&
    !location.is_blocked &&
    (location.is_empty ||
      location.allow_mixed_products ||
      product?.storage_location === location.id);

  const freeLocations = storageLocations.filter((location) =>
    isLocationAvailableForProduct(location, selectedProduct)
  );

  const getLocationCapacity = (location: StorageLocation) => {
    const locationVolume = getVolumeCm3(location);
    const maxWeight = toPositiveNumber(location.max_weight_kg);

    const occupiedVolume =
      toPositiveNumber(location.occupied_volume_cm3) ?? 0;
    const occupiedWeight =
      toPositiveNumber(location.occupied_weight_kg) ?? 0;

    const totalVolumeAfterBooking = occupiedVolume + requiredVolume;
    const totalWeightAfterBooking = occupiedWeight + requiredWeight;

    const availableVolume =
      locationVolume !== null ? locationVolume - occupiedVolume : null;
    const availableWeight =
      maxWeight !== null ? maxWeight - occupiedWeight : null;

    const volumeFits =
      requiredVolume === 0 ||
      locationVolume === null ||
      totalVolumeAfterBooking <= locationVolume;

    const weightFits =
      requiredWeight === 0 ||
      maxWeight === null ||
      totalWeightAfterBooking <= maxWeight;

    return {
      locationVolume,
      maxWeight,
      occupiedVolume,
      occupiedWeight,
      availableVolume,
      availableWeight,
      totalVolumeAfterBooking,
      totalWeightAfterBooking,
      volumeFits,
      weightFits,
      fits: volumeFits && weightFits,
    };
  };

  const getCapacitySuitableLocationsForProduct = (
    product?: Product | null
  ) =>
    storageLocations
      .filter((location) => isLocationAvailableForProduct(location, product))
      .filter((location) => getLocationCapacity(location).fits);

  const getPreferredLocationForProduct = (product?: Product | null) => {
    const availableLocationsForProduct = storageLocations.filter((location) =>
      isLocationAvailableForProduct(location, product)
    );

    const capacitySuitableLocationsForProduct =
      getCapacitySuitableLocationsForProduct(product);

    const fixedLocation = product?.fixed_storage_location
      ? storageLocations.find(
          (location) => location.id === product.fixed_storage_location
        ) ?? null
      : null;

    const currentProductLocation = product?.storage_location
      ? storageLocations.find(
          (location) => location.id === product.storage_location
        ) ?? null
      : null;

    if (product?.putaway_strategy === "FIXED_BIN") {
      if (
        fixedLocation &&
        availableLocationsForProduct.some(
          (location) => location.id === fixedLocation.id
        ) &&
        getLocationCapacity(fixedLocation).fits
      ) {
        return fixedLocation;
      }

      return null;
    }

    if (
      product?.putaway_strategy === "ADD_TO_STOCK" &&
      currentProductLocation &&
      availableLocationsForProduct.some(
        (location) => location.id === currentProductLocation.id
      ) &&
      getLocationCapacity(currentProductLocation).fits
    ) {
      return currentProductLocation;
    }

    if (product?.putaway_strategy === "EMPTY_BIN") {
      const emptyLocation = capacitySuitableLocationsForProduct.find(
        (location) => location.is_empty
      );

      return emptyLocation ?? capacitySuitableLocationsForProduct[0] ?? null;
    }

    if (
      currentProductLocation &&
      availableLocationsForProduct.some(
        (location) => location.id === currentProductLocation.id
      ) &&
      getLocationCapacity(currentProductLocation).fits
    ) {
      return currentProductLocation;
    }

    return capacitySuitableLocationsForProduct[0] ?? null;
  };

  const suggestedLocation = getPreferredLocationForProduct(selectedProduct);

  const selectedStorageLocationId = movementStorageLocationId;

  const selectedStorageLocation =
    storageLocations.find(
      (location) => String(location.id) === selectedStorageLocationId
    ) ?? null;

  const selectedLocationCapacity = selectedStorageLocation
    ? getLocationCapacity(selectedStorageLocation)
    : null;

  const formatCapacityNumber = (value: number | null) =>
    value === null
      ? "—"
      : value.toLocaleString("de-DE", {
          maximumFractionDigits: 0,
        });

  const getCapacityPercent = (
    used?: number | null,
    max?: number | null
  ) => {
    if (
      used === null ||
      used === undefined ||
      max === null ||
      max === undefined ||
      max <= 0
    ) {
      return null;
    }

    return Math.round((used / max) * 100);
  };

  const getCapacityColor = (percent: number | null) => {
    if (percent === null) return "#64748b";
    if (percent > 100) return "#dc2626";
    if (percent >= 85) return "#f97316";
    if (percent >= 70) return "#eab308";
    return "#22c55e";
  };

  const getCapacityLabel = (percent: number | null) => {
    if (percent === null) return "unbekannt";
    if (percent > 100) return "überschritten";
    if (percent >= 85) return "kritisch";
    if (percent >= 70) return "hoch";
    return "okay";
  };

  const volumeUsagePercent = selectedLocationCapacity
    ? getCapacityPercent(
        selectedLocationCapacity.totalVolumeAfterBooking,
        selectedLocationCapacity.locationVolume
      )
    : null;

  const weightUsagePercent = selectedLocationCapacity
    ? getCapacityPercent(
        selectedLocationCapacity.totalWeightAfterBooking,
        selectedLocationCapacity.maxWeight
      )
    : null;

  const highestCapacityPercent =
    volumeUsagePercent !== null && weightUsagePercent !== null
      ? Math.max(volumeUsagePercent, weightUsagePercent)
      : volumeUsagePercent ?? weightUsagePercent;

  const capacitySignal =
    selectedLocationCapacity?.fits === false
      ? "🔴"
      : highestCapacityPercent === null
      ? "⚪"
      : highestCapacityPercent >= 85
      ? "🟡"
      : "🟢";

  const capacityStatusText =
    selectedLocationCapacity?.fits === false
      ? "passt nicht"
      : highestCapacityPercent === null
      ? "Kapazität unbekannt"
      : highestCapacityPercent >= 85
      ? "passt, aber knapp"
      : "passt";

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>📥 Wareneingang buchen</h2>

      <p style={infoStyle}>
        Beim Wareneingang werden freie, aktive und nicht gesperrte Lagerplätze
        bevorzugt. Belegte Plätze werden angezeigt, wenn Mischlagerung erlaubt
        ist oder es sich um den aktuellen Lagerplatz dieses Produkts handelt.
      </p>

      <div style={dashboardGridStyle}>
        <Card title="Verfügbare Plätze" value={String(freeLocations.length)} />
        <Card
          title="Gesperrte Plätze"
          value={String(storageLocations.filter((location) => location.is_blocked).length)}
          danger={storageLocations.some((location) => location.is_blocked)}
        />
        <Card
          title="Vorschlag"
          value={suggestedLocation ? suggestedLocation.code : "—"}
        />
      </div>

      {suggestedLocation && (
        <p style={successStyle}>
          💡 Vorschlag: {suggestedLocation.code} - {suggestedLocation.name}
          {suggestedLocation.rack ? ` / Regal ${suggestedLocation.rack}` : ""}
          {suggestedLocation.shelf ? ` / Fach ${suggestedLocation.shelf}` : ""}
        </p>
      )}

      {movementProductId && capacityNeedsCheck && !suggestedLocation && (
        <p
          style={{
            border: "1px solid #92400e",
            borderRadius: "14px",
            padding: "12px 16px",
            background: "rgba(120, 53, 15, 0.18)",
            color: "#fed7aa",
          }}
        >
          ⚠️ Kein passender verfügbarer Lagerplatz gefunden. Bitte Packmenge
          reduzieren, Verpackung/Ladungsträger ändern oder einen größeren
          Lagerplatz anlegen.
        </p>
      )}

      {hasPermission("lager") &&
        (!movementStorageLocationId ||
          !movementPackagingTypeId ||
          !movementLoadCarrierTypeId ||
          !movementReferenceNumber.trim()) && (
          <div
            style={{
              border: "1px solid #92400e",
              borderRadius: "14px",
              padding: "12px 16px",
              margin: "14px 0",
              background: "rgba(120, 53, 15, 0.18)",
              color: "#fed7aa",
            }}
          >
            <strong>⚠️ Pflichtfelder fehlen im Wareneingang</strong>

            <div style={{ marginTop: "8px", lineHeight: 1.6 }}>
              {!movementStorageLocationId && (
                <div>• Bitte einen Lagerplatz auswählen.</div>
              )}

              {!movementPackagingTypeId && (
                <div>• Bitte eine Verpackung auswählen.</div>
              )}

              {!movementLoadCarrierTypeId && (
                <div>• Bitte einen Ladungsträger auswählen.</div>
              )}

              {!movementReferenceNumber.trim() && (
                <div>• Bitte eine Referenz- oder Lieferscheinnummer eintragen.</div>
              )}
            </div>
          </div>
        )}

      <form onSubmit={handleGoodsReceipt} style={formGridStyle}>
        <select
          ref={goodsInProductRef}
          value={movementProductId}
          onChange={(event) => {
            const nextProductId = event.target.value;
            const nextProduct = products.find(
              (product) => String(product.id) === nextProductId
            );

            const nextSuggestedLocation =
              getPreferredLocationForProduct(nextProduct);

            setMovementProductId(nextProductId);
            setMovementStorageLocationId(
              nextSuggestedLocation ? String(nextSuggestedLocation.id) : ""
            );
          }}
          onKeyDown={(event) => focusNextOnEnter(event, goodsInQuantityRef.current)}
          required
          style={inputStyle}
          disabled={!hasPermission("lager")}
        >
          <option value="">Produkt auswählen</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} ({product.sku})
              {product.storage_location_label
                ? ` - aktuell: ${product.storage_location_label}`
                : ""}
            </option>
          ))}
        </select>

        <input
          ref={goodsInQuantityRef}
          type="number"
          placeholder="Menge"
          value={movementQuantity}
          onChange={(event) => {
            setMovementQuantity(event.target.value);
            setMovementStorageLocationId("");
          }}
          required
          min="1"
          style={inputStyle}
          disabled={!hasPermission("lager")}
        />
        <select
          value={selectedStorageLocationId}
          onChange={(event) => setMovementStorageLocationId(event.target.value)}
          style={inputStyle}
          disabled={!hasPermission("lager")}
        >
          <option value="">Lagerplatz auswählen</option>

          {freeLocations.map((location) => {
            const locationCapacity = getLocationCapacity(location);
            const isSameProductLocation =
              selectedProduct?.storage_location === location.id;

            return (
              <option
                key={location.id}
                value={location.id}
                disabled={!locationCapacity.fits}
              >
                {location.code} - {location.name}
                {location.is_empty
                  ? " / frei"
                  : isSameProductLocation
                  ? " / Zulagerung"
                  : " / Mischlager"}
                {capacityNeedsCheck
                  ? locationCapacity.fits
                    ? " / passt"
                    : " / zu klein"
                  : ""}
              </option>
            );
          })}
        </select>
        <select
          value={movementPackagingTypeId}
          onChange={(event) => {
            setMovementPackagingTypeId(event.target.value);
            setMovementStorageLocationId("");
          }}
          style={inputStyle}
          disabled={!hasPermission("lager")}
        >
          <option value="">Verpackung auswählen</option>
          {packagingTypes
            .filter(
              (packagingType) =>
                packagingType.is_active &&
                packagingType.category === "PACKAGING"
            )
            .map((packagingType) => (
              <option key={packagingType.id} value={packagingType.id}>
                {packagingType.name}
                {packagingType.unit_cost ? ` · ${packagingType.unit_cost} €` : ""}
              </option>
            ))}
        </select>

        <select
          value={movementLoadCarrierTypeId}
          onChange={(event) => {
            setMovementLoadCarrierTypeId(event.target.value);
            setMovementStorageLocationId("");
          }}
          style={inputStyle}
          disabled={!hasPermission("lager")}
        >
          <option value="">Ladungsträger auswählen</option>
          {packagingTypes
            .filter(
              (packagingType) =>
                packagingType.is_active &&
                packagingType.category === "LOAD_CARRIER"
            )
            .map((packagingType) => (
              <option key={packagingType.id} value={packagingType.id}>
                {packagingType.name}
                {packagingType.unit_cost ? ` · ${packagingType.unit_cost} €` : ""}
              </option>
            ))}
        </select>

        <input
          type="number"
          min="1"
          placeholder="Anzahl Verpackungen"
          value={movementPackagingQuantity}
          onChange={(event) => {
            setMovementPackagingQuantity(event.target.value);
            setMovementStorageLocationId("");
          }}
          style={inputStyle}
          disabled={!hasPermission("lager")}
        />

        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Einstandspreis pro Stück"
          value={movementUnitPurchasePrice}
          onChange={(event) => setMovementUnitPurchasePrice(event.target.value)}
          style={inputStyle}
          disabled={!hasPermission("lager")}
        />

        <input
          type="date"
          placeholder="MHD / Ablaufdatum"
          value={movementExpiryDate}
          onChange={(event) => setMovementExpiryDate(event.target.value)}
          style={inputStyle}
          disabled={!hasPermission("lager")}
        />


        {selectedStorageLocation && capacityNeedsCheck && selectedLocationCapacity && (
          <div
            style={{
              gridColumn: "1 / -1",
              border: selectedLocationCapacity.fits
                ? "1px solid #166534"
                : "1px solid #7f1d1d",
              borderRadius: "14px",
              padding: "14px 16px",
              background: selectedLocationCapacity.fits
                ? "rgba(22, 101, 52, 0.16)"
                : "rgba(127, 29, 29, 0.18)",
            }}
          >
            <strong
              style={{
                display: "block",
                color: selectedLocationCapacity.fits ? "#bbf7d0" : "#fecaca",
                marginBottom: "10px",
              }}
            >
              📐 Kapazitätsvorschau
            </strong>

            <div style={{ marginBottom: "14px" }}>
              <strong
                style={{
                  display: "block",
                  color: "#e2e8f0",
                  marginBottom: "8px",
                }}
              >
                Kapazitätsauslastung
              </strong>

              {volumeUsagePercent !== null && (
                <div style={{ marginBottom: "10px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                      color: "#cbd5e1",
                    }}
                  >
                    <span>Volumen</span>
                    <span>
                      {volumeUsagePercent}% · {getCapacityLabel(volumeUsagePercent)}
                    </span>
                  </div>

                  <div
                    style={{
                      height: "12px",
                      borderRadius: "999px",
                      overflow: "hidden",
                      background: "rgba(148, 163, 184, 0.22)",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(Math.max(volumeUsagePercent, 0), 100)}%`,
                        height: "100%",
                        background: getCapacityColor(volumeUsagePercent),
                      }}
                    />
                  </div>
                </div>
              )}

              {weightUsagePercent !== null && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                      color: "#cbd5e1",
                    }}
                  >
                    <span>Gewicht</span>
                    <span>
                      {weightUsagePercent}% · {getCapacityLabel(weightUsagePercent)}
                    </span>
                  </div>

                  <div
                    style={{
                      height: "12px",
                      borderRadius: "999px",
                      overflow: "hidden",
                      background: "rgba(148, 163, 184, 0.22)",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(Math.max(weightUsagePercent, 0), 100)}%`,
                        height: "100%",
                        background: getCapacityColor(weightUsagePercent),
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "10px",
              }}
            >
              <div>
                <span style={{ color: "#94a3b8" }}>Lagerplatz</span>
                <div>{selectedStorageLocation.code}</div>
              </div>

              <div>
                <span style={{ color: "#94a3b8" }}>Volumen belegt</span>
                <div>
                  {formatCapacityNumber(selectedLocationCapacity.occupiedVolume)} cm³
                </div>
              </div>

              <div>
                <span style={{ color: "#94a3b8" }}>Volumen neue Buchung</span>
                <div>{formatCapacityNumber(requiredVolume)} cm³</div>
              </div>

              <div>
                <span style={{ color: "#94a3b8" }}>Volumen nach Buchung</span>
                <div>
                  {formatCapacityNumber(selectedLocationCapacity.totalVolumeAfterBooking)} cm³
                </div>
              </div>

              <div>
                <span style={{ color: "#94a3b8" }}>Volumen maximal</span>
                <div>
                  {formatCapacityNumber(selectedLocationCapacity.locationVolume)} cm³
                </div>
              </div>

              <div>
                <span style={{ color: "#94a3b8" }}>Gewicht belegt</span>
                <div>
                  {formatCapacityNumber(selectedLocationCapacity.occupiedWeight)} kg
                </div>
              </div>

              <div>
                <span style={{ color: "#94a3b8" }}>Gewicht neue Buchung</span>
                <div>{formatCapacityNumber(requiredWeight)} kg</div>
              </div>

              <div>
                <span style={{ color: "#94a3b8" }}>Gewicht nach Buchung</span>
                <div>
                  {formatCapacityNumber(selectedLocationCapacity.totalWeightAfterBooking)} kg
                </div>
              </div>

              <div>
                <span style={{ color: "#94a3b8" }}>Gewicht maximal</span>
                <div>{formatCapacityNumber(selectedLocationCapacity.maxWeight)} kg</div>
              </div>

              <div>
                <span style={{ color: "#94a3b8" }}>Status</span>
                <div>
                  {capacitySignal} {capacityStatusText}
                </div>
              </div>
            </div>

            {!selectedLocationCapacity.fits && (
              <p style={{ margin: "10px 0 0", color: "#fecaca" }}>
                Dieser Lagerplatz wird beim Buchen vom Backend abgelehnt. Bitte
                Packmenge reduzieren, Ladungsträger ändern oder einen größeren
                Lagerplatz wählen.
              </p>
            )}
          </div>
        )}

        <input
          type="text"
          placeholder="Lieferschein / Referenznummer"
          value={movementReferenceNumber}
          onChange={(event) => setMovementReferenceNumber(event.target.value)}
          style={inputStyle}
          disabled={!hasPermission("lager")}
        />

        <textarea
          placeholder="Notiz"
          value={movementNote}
          onChange={(event) => setMovementNote(event.target.value)}
          style={{ ...inputStyle, minHeight: "70px", gridColumn: "1 / -1" }}
          disabled={!hasPermission("lager")}
        />

        <div style={{ gridColumn: "1 / -1" }}>
          <button
            type="submit"
            disabled={
              movementSaving ||
              !hasPermission("lager") ||
              !movementStorageLocationId ||
              !movementPackagingTypeId ||
              !movementLoadCarrierTypeId ||
              !movementReferenceNumber.trim()
            }
            style={hasPermission("lager") ? primaryButtonStyle : disabledButtonStyle}
          >
            {movementSaving ? "Buche..." : "Wareneingang buchen"}
          </button>
        </div>
      </form>
    </section>
  );
}

function GoodsOutSection({
  products,
  storageLocations,
  movements,
  packagingTypes,
  goodsOutProductId,
  goodsOutStorageLocationId,
  setGoodsOutStorageLocationId,
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
  storageLocations: StorageLocation[];
  movements: StockMovement[];
  packagingTypes: PackagingType[];
  goodsOutProductId: string;
  goodsOutStorageLocationId: string;
  setGoodsOutStorageLocationId: (value: string) => void;
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
  const selectedProductId = Number(goodsOutProductId);
  const goodsOutQuantityNumber = Number(goodsOutQuantity || 0);

  const selectedGoodsOutProduct =
    products.find((product) => product.id === selectedProductId) ?? null;

  const goodsOutAvailableLocations = storageLocations.filter((location) => {
    if (!location.is_active || location.is_blocked || !selectedGoodsOutProduct) {
      return false;
    }

    const isCurrentProductLocation =
      selectedGoodsOutProduct.storage_location === location.id;

    const hadProductGoodsReceiptOnLocation = movements.some(
      (movement) =>
        movement.product === selectedProductId &&
        movement.storage_location === location.id &&
        movement.movement_type === "IN"
    );

    return isCurrentProductLocation || hadProductGoodsReceiptOnLocation;
  });

  const latestPackagingMovement = movements
    .filter(
      (movement) =>
        movement.product === selectedProductId &&
        movement.movement_type === "IN" &&
        Boolean(
          movement.packaging_type ||
            movement.load_carrier_type ||
            movement.packaging_type_name ||
            movement.load_carrier_type_name
        )
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

  const sourceQuantity = Math.max(
    1,
    Math.abs(latestPackagingMovement?.quantity || 1)
  );

  const sourcePackagingQuantity = Math.max(
    1,
    latestPackagingMovement?.packaging_quantity || 1
  );

  const unitsPerPackage = Math.max(
    1,
    Math.floor(sourceQuantity / sourcePackagingQuantity)
  );

  const previewPackagingQuantity =
    latestPackagingMovement && goodsOutQuantityNumber > 0
      ? Math.max(1, Math.ceil(goodsOutQuantityNumber / unitsPerPackage))
      : null;

  const findPackagingType = (id?: number | null, name?: string | null) =>
    packagingTypes.find((packagingType) => packagingType.id === id) ??
    packagingTypes.find((packagingType) => packagingType.name === name);

  const previewPackagingType = findPackagingType(
    latestPackagingMovement?.packaging_type,
    latestPackagingMovement?.packaging_type_name
  );

  const previewLoadCarrierType = findPackagingType(
    latestPackagingMovement?.load_carrier_type,
    latestPackagingMovement?.load_carrier_type_name
  );

  const previewCost =
    latestPackagingMovement && previewPackagingQuantity !== null
      ? Number(previewPackagingType?.unit_cost ?? 0) *
          previewPackagingQuantity +
        Number(previewLoadCarrierType?.unit_cost ?? 0)
      : null;

  const previewCostLabel =
    previewCost !== null
      ? `${previewCost.toLocaleString("de-DE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} €`
      : "—";

  const goodsOutRemovalStrategy =
    selectedGoodsOutProduct?.removal_strategy || "FIFO";

  const goodsOutRemovalStrategyLabel =
    {
      FIFO: "FIFO - älteste Lagerplatzposition zuerst",
      LIFO: "LIFO - neueste Lagerplatzposition zuerst",
      FEFO: "FEFO - frühestes MHD zuerst",
      HIFO: "HIFO - höchster Preis zuerst",
      LOFO: "LOFO - niedrigster Preis zuerst",
    }[goodsOutRemovalStrategy] || goodsOutRemovalStrategy;

  const goodsOutUsesFallbackStrategy = false;

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>📤 Warenausgang buchen</h2>

      {selectedGoodsOutProduct && (
        <p style={infoStyle}>
          📦 Aktive Auslagerstrategie: {goodsOutRemovalStrategyLabel}
          {goodsOutUsesFallbackStrategy
            ? " · Hinweis: Diese Strategie nutzt aktuell FIFO als Fallback, bis MHD-/Preisfelder je Lagerplatzbestand vorhanden sind."
            : ""}
        </p>
      )}
      {hasPermission("lager") &&
        (!goodsOutStorageLocationId || !goodsOutReferenceNumber.trim()) && (
        <div
          style={{
            border: "1px solid #92400e",
            borderRadius: "14px",
            padding: "12px 16px",
            margin: "14px 0",
            background: "rgba(120, 53, 15, 0.18)",
            color: "#fed7aa",
          }}
        >
          <strong>⚠️ Pflichtfeld fehlt im Warenausgang</strong>

          <div style={{ marginTop: "8px", lineHeight: 1.6 }}>
            {!goodsOutStorageLocationId && (
              <div>• Bitte einen Lagerplatz auswählen.</div>
            )}

            {!goodsOutReferenceNumber.trim() && (
              <div>• Bitte eine Referenznummer eintragen.</div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleGoodsIssue} style={formGridStyle}>
        <select ref={goodsOutProductRef} value={goodsOutProductId} onChange={(event) => setGoodsOutProductId(event.target.value)} onKeyDown={(event) => focusNextOnEnter(event, goodsOutQuantityRef.current)} required style={inputStyle} disabled={!hasPermission("lager")}>
          <option value="">Produkt auswählen</option>
          {products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}
        </select>
        <input ref={goodsOutQuantityRef} type="number" placeholder="Menge" value={goodsOutQuantity} onChange={(event) => setGoodsOutQuantity(event.target.value)} required min="1" style={inputStyle} disabled={!hasPermission("lager")} />
        <select
          value={goodsOutStorageLocationId}
          onChange={(event) => setGoodsOutStorageLocationId(event.target.value)}
          required
          style={inputStyle}
          disabled={!hasPermission("lager") || !goodsOutProductId}
        >
          <option value="">Lagerplatz auswählen</option>
          {goodsOutAvailableLocations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.code} - {location.name}
              {location.rack ? ` / Regal ${location.rack}` : ""}
              {location.shelf ? ` / Fach ${location.shelf}` : ""}
            </option>
          ))}
        </select>
        <input type="text" placeholder="Referenznummer" value={goodsOutReferenceNumber} onChange={(event) => setGoodsOutReferenceNumber(event.target.value)} style={inputStyle} disabled={!hasPermission("lager")} />
        <textarea placeholder="Notiz" value={goodsOutNote} onChange={(event) => setGoodsOutNote(event.target.value)} style={{ ...inputStyle, minHeight: "48px", gridColumn: "1 / -1" }} disabled={!hasPermission("lager")} />
        {goodsOutProductId && latestPackagingMovement && (
          <div
            style={{
              gridColumn: "1 / -1",
              border: "1px solid #334155",
              borderRadius: "14px",
              padding: "14px 16px",
              background: "rgba(15, 23, 42, 0.92)",
            }}
          >
            <strong
              style={{
                display: "block",
                color: "#bae6fd",
                marginBottom: "10px",
              }}
            >
              📦 Automatische Verpackungsvorschau
            </strong>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "10px",
              }}
            >
              <div>
                <span style={{ color: "#94a3b8" }}>Verpackung</span>
                <div>
                  {latestPackagingMovement.packaging_type_name ||
                    previewPackagingType?.name ||
                    "—"}
                </div>
              </div>

              <div>
                <span style={{ color: "#94a3b8" }}>Ladungsträger</span>
                <div>
                  {latestPackagingMovement.load_carrier_type_name ||
                    previewLoadCarrierType?.name ||
                    "—"}
                </div>
              </div>

              <div>
                <span style={{ color: "#94a3b8" }}>Packmenge</span>
                <div>{previewPackagingQuantity ?? "Menge eingeben"}</div>
              </div>

              <div>
                <span style={{ color: "#94a3b8" }}>Kosten</span>
                <div>
                  {previewPackagingQuantity ? previewCostLabel : "Menge eingeben"}
                </div>
              </div>
            </div>

            <p style={{ margin: "10px 0 0", color: "#94a3b8" }}>
              Grundlage: letzter Wareneingang mit Verpackungsdaten für dieses
              Produkt. Beim Buchen übernimmt das Backend diese Werte automatisch.
            </p>
          </div>
        )}

        {goodsOutProductId && !latestPackagingMovement && (
          <div
            style={{
              gridColumn: "1 / -1",
              border: "1px solid #92400e",
              borderRadius: "14px",
              padding: "14px 16px",
              background: "rgba(120, 53, 15, 0.18)",
              color: "#fed7aa",
            }}
          >
            Für dieses Produkt gibt es noch keinen Wareneingang mit
            Verpackungsdaten. Der Warenausgang wird trotzdem gebucht, aber ohne
            automatische Verpackungsvorschau.
          </div>
        )}

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
  handleExportInventoryPdf,
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
  handleExportInventoryPdf: () => Promise<void>;
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
  const [selectedInventoryExportType, setSelectedInventoryExportType] =
    useState<"" | "excel" | "pdf">("");

  const handleInventoryReportExport = () => {
    if (selectedInventoryExportType === "excel") {
      void handleExportInventoryExcel();
      return;
    }

    if (selectedInventoryExportType === "pdf") {
      void handleExportInventoryPdf();
    }
  };

  const inventoryPanelStyle: CSSProperties = {
    background: "rgba(15, 23, 42, 0.78)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 18px 36px rgba(0,0,0,0.18)",
  };

  const inventoryPanelTitleStyle: CSSProperties = {
    margin: "0 0 14px 0",
    color: "#bfdbfe",
    fontSize: "1rem",
  };

  const inventorySummaryGridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
    marginTop: "18px",
  };

  const inventorySummaryItemStyle: CSSProperties = {
    background: "rgba(30, 41, 59, 0.62)",
    border: "1px solid rgba(148, 163, 184, 0.14)",
    borderRadius: "14px",
    padding: "14px 16px",
    textAlign: "center",
  };

  const inventorySummaryLabelStyle: CSSProperties = {
    color: "#94a3b8",
    fontSize: "0.82rem",
    marginBottom: "6px",
  };

  const inventorySummaryValueStyle: CSSProperties = {
    color: "#f8fafc",
    fontSize: "1.45rem",
    fontWeight: 800,
  };

  const inventoryTwoColumnStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "16px",
    marginTop: "18px",
  };

  const inventoryFormCompactStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "10px",
  };

  const inventoryExportGridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "10px",
    alignItems: "center",
  };

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>🧾 Inventur-Modus</h2>

      <p style={infoStyle}>
        Inventuren starten, Zählungen erfassen, Abweichungen prüfen und Berichte exportieren.
      </p>

      <div style={inventorySummaryGridStyle}>
        <div style={inventorySummaryItemStyle}>
          <div style={inventorySummaryLabelStyle}>Positionen</div>
          <div style={inventorySummaryValueStyle}>{inventorySummary.total}</div>
        </div>

        <div style={inventorySummaryItemStyle}>
          <div style={inventorySummaryLabelStyle}>Gezählt</div>
          <div style={inventorySummaryValueStyle}>{inventorySummary.done}</div>
        </div>

        <div style={inventorySummaryItemStyle}>
          <div style={inventorySummaryLabelStyle}>Differenzen</div>
          <div
            style={{
              ...inventorySummaryValueStyle,
              color: inventorySummary.differences > 0 ? "#fecaca" : "#f8fafc",
            }}
          >
            {inventorySummary.differences}
          </div>
        </div>

        <div style={inventorySummaryItemStyle}>
          <div style={inventorySummaryLabelStyle}>Korrigiert</div>
          <div style={inventorySummaryValueStyle}>{inventorySummary.corrected}</div>
        </div>
      </div>

      <div style={inventoryTwoColumnStyle}>
        <div style={inventoryPanelStyle}>
          <h3 style={inventoryPanelTitleStyle}>➕ Neue Inventur</h3>

          <form onSubmit={handleCreateInventorySession} style={inventoryFormCompactStyle}>
            <input
              type="text"
              placeholder="Titel der Inventur"
              value={inventoryTitle}
              onChange={(event) => setInventoryTitle(event.target.value)}
              style={inputStyle}
              disabled={!hasPermission("lager")}
            />

            <input
              type="text"
              placeholder="Notiz zur Inventur"
              value={inventoryNote}
              onChange={(event) => setInventoryNote(event.target.value)}
              style={inputStyle}
              disabled={!hasPermission("lager")}
            />

            <button
              type="submit"
              disabled={inventorySaving || !hasPermission("lager")}
              style={hasPermission("lager") ? primaryButtonStyle : disabledButtonStyle}
            >
              {inventorySaving ? "Erstelle..." : "Neue Inventur starten"}
            </button>
          </form>
        </div>

        <div style={inventoryPanelStyle}>
          <h3 style={inventoryPanelTitleStyle}>📂 Inventur laden & Bericht</h3>

          <div style={inventoryFormCompactStyle}>
            <select
              value={selectedInventorySessionId}
              onChange={(event) => setSelectedInventorySessionId(event.target.value)}
              style={inputStyle}
            >
              <option value="">Inventur auswählen</option>
              {inventorySessions.map((session) => (
                <option key={session.id} value={session.id}>
                  #{session.id} {session.title} ({session.status === "OPEN" ? "Offen" : "Abgeschlossen"})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void loadInventoryCounts(selectedInventorySessionId)}
              style={secondaryButtonStyle}
              disabled={!selectedInventorySessionId}
            >
              Inventur laden
            </button>

            <button
              type="button"
              onClick={() => void handleCompleteInventorySession()}
              style={secondaryButtonStyle}
              disabled={
                !selectedInventorySession ||
                selectedInventorySession.status === "COMPLETED" ||
                !hasPermission("lager")
              }
            >
              Inventur abschließen
            </button>

            <div style={inventoryExportGridStyle}>
              <select
                value={selectedInventoryExportType}
                onChange={(event) =>
                  setSelectedInventoryExportType(event.target.value as "" | "excel" | "pdf")
                }
                style={inputStyle}
                disabled={!selectedInventorySessionId}
              >
                <option value="">Bericht auswählen</option>
                <option value="excel">📤 Excel-Bericht (.xlsx)</option>
                <option value="pdf">📄 PDF-Bericht (.pdf)</option>
              </select>

              <button
                type="button"
                onClick={handleInventoryReportExport}
                style={secondaryButtonStyle}
                disabled={!selectedInventorySessionId || !selectedInventoryExportType}
              >
                Exportieren
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedInventorySession && (
        <p style={{ ...infoStyle, marginTop: "18px" }}>
          Aktive Inventur: <strong>{selectedInventorySession.title}</strong> | Status:{" "}
          <strong>
            {selectedInventorySession.status === "OPEN" ? "Offen" : "Abgeschlossen"}
          </strong>
        </p>
      )}

      <div style={{ ...inventoryPanelStyle, marginTop: "18px" }}>
        <h3 style={inventoryPanelTitleStyle}>🧮 Zählung erfassen</h3>

        <form onSubmit={handleAddInventoryCount} style={inventoryFormCompactStyle}>
          <select
            ref={inventoryProductRef}
            value={inventoryProductId}
            onChange={(event) => setInventoryProductId(event.target.value)}
            onKeyDown={(event) =>
              focusNextOnEnter(event, inventoryCountedQuantityRef.current)
            }
            style={inputStyle}
            disabled={
              !hasPermission("lager") ||
              !selectedInventorySessionId ||
              selectedInventorySession?.status === "COMPLETED"
            }
          >
            <option value="">Produkt auswählen</option>
            {products
              .filter((product) => !countedProductIds.has(product.id))
              .map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku}) - Soll: {product.quantity} {product.unit}
                </option>
              ))}
          </select>

          <input
            ref={inventoryCountedQuantityRef}
            type="number"
            placeholder="Gezählte Menge"
            value={inventoryCountedQuantity}
            onChange={(event) => setInventoryCountedQuantity(event.target.value)}
            min="0"
            style={inputStyle}
            disabled={
              !hasPermission("lager") ||
              !selectedInventorySessionId ||
              selectedInventorySession?.status === "COMPLETED"
            }
          />

          <input
            type="text"
            placeholder="Notiz zur Zählung"
            value={inventoryCountNote}
            onChange={(event) => setInventoryCountNote(event.target.value)}
            style={inputStyle}
            disabled={
              !hasPermission("lager") ||
              !selectedInventorySessionId ||
              selectedInventorySession?.status === "COMPLETED"
            }
          />

          <button
            type="submit"
            disabled={
              inventorySaving ||
              !hasPermission("lager") ||
              !selectedInventorySessionId ||
              selectedInventorySession?.status === "COMPLETED"
            }
            style={hasPermission("lager") ? primaryButtonStyle : disabledButtonStyle}
          >
            {inventorySaving ? "Speichere..." : "Zählung speichern"}
          </button>
        </form>

        {selectedInventoryProduct && (
          <p style={{ ...infoStyle, background: "rgba(30, 41, 59, 0.75)" }}>
            Ausgewähltes Produkt: <strong>{selectedInventoryProduct.name}</strong> |
            Systembestand:{" "}
            <strong>
              {selectedInventoryProduct.quantity} {selectedInventoryProduct.unit}
            </strong>
          </p>
        )}
      </div>

      <div style={{ marginTop: "18px" }}>
        {inventoryLoading && <p>Lade Inventur...</p>}

        {!inventoryLoading && inventoryCounts.length > 0 && (
          <InventoryCountTable
            inventoryCounts={inventoryCounts}
            selectedInventorySession={selectedInventorySession}
            inventoryCorrectionSavingId={inventoryCorrectionSavingId}
            hasPermission={hasPermission}
            handleApplyInventoryCorrection={handleApplyInventoryCorrection}
          />
        )}

        {!inventoryLoading && selectedInventorySessionId && inventoryCounts.length === 0 && (
          <p>Noch keine Inventurpositionen vorhanden.</p>
        )}
      </div>
    </section>
  );
}

function LocationStockOverview({
  locationStocks,
  loading,
  search,
  exportLocationStocksToExcel,
}: {
  locationStocks: StorageLocationStock[];
  loading: boolean;
  search: string;
  exportLocationStocksToExcel: () => Promise<void>;
}) {
  const normalizedSearch = search.trim().toLowerCase();

  const filteredLocationStocks = locationStocks.filter((stock) => {
    if (!normalizedSearch) return true;

    return [
      stock.product_name,
      stock.product_sku,
      stock.storage_location_code,
      stock.storage_location_name,
      stock.storage_location_label,
      stock.packaging_type_name ?? "",
      stock.load_carrier_type_name ?? "",
      stock.expiry_date ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });

  const totalQuantity = filteredLocationStocks.reduce(
    (sum, stock) => sum + stock.quantity,
    0
  );

  if (loading) {
    return <p>Lade Lagerplatzbestände...</p>;
  }

  if (filteredLocationStocks.length === 0) {
    return <p>Keine Lagerplatzbestände passen zur aktuellen Suche.</p>;
  }

  return (
    <section style={sectionStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 0 }}>📦 Lagerplatzbestand</h3>

        <button
          type="button"
          onClick={() => void exportLocationStocksToExcel()}
          style={secondaryButtonStyle}
        >
          📤 Lagerplatzbestand als Excel exportieren
        </button>
      </div>

      <div style={dashboardGridStyle}>
        <Card title="Positionen" value={String(filteredLocationStocks.length)} />
        <Card title="Menge gesamt" value={String(totalQuantity)} />
      </div>

      <div style={{ ...tableWrapStyle, marginTop: "22px" }}>
        <table style={dataTableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={tableHeadStyle}>Lagerplatz</th>
              <th style={tableHeadStyle}>Produkt</th>
              <th style={tableHeadStyle}>SKU</th>
              <th style={tableHeadStyle}>Menge</th>
              <th style={tableHeadStyle}>Verpackung</th>
              <th style={tableHeadStyle}>Ladungsträger</th>
              <th style={tableHeadStyle}>Packmenge</th>
              <th style={tableHeadStyle}>Einstandspreis</th>
              <th style={tableHeadStyle}>MHD</th>
              <th style={tableHeadStyle}>Aktualisiert</th>
            </tr>
          </thead>

          <tbody>
            {filteredLocationStocks.map((stock) => (
              <tr
                key={stock.id}
                style={{
                  borderTop: "1px solid rgba(148, 163, 184, 0.12)",
                  background: "rgba(30, 41, 59, 0.35)",
                }}
              >
                <td style={tableCellStyle}>
                  <strong>{stock.storage_location_code}</strong>
                  <div style={{ color: "#94a3b8" }}>
                    {stock.storage_location_name}
                  </div>
                </td>
                <td style={tableCellStyle}>{stock.product_name}</td>
                <td style={tableCellStyle}>{stock.product_sku}</td>
                <td style={tableCellStyle}>
                  {stock.quantity} {stock.product_unit}
                </td>
                <td style={tableCellStyle}>
                  {stock.packaging_type_name || "—"}
                </td>
                <td style={tableCellStyle}>
                  {stock.load_carrier_type_name || "—"}
                </td>
                <td style={tableCellStyle}>
                  {stock.packaging_quantity ?? "—"}
                </td>
                <td style={tableCellStyle}>
                  {stock.unit_purchase_price
                    ? `${Number(stock.unit_purchase_price).toLocaleString("de-DE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} €`
                    : "—"}
                </td>
                <td style={tableCellStyle}>
                  {stock.expiry_date
                    ? new Date(stock.expiry_date).toLocaleDateString("de-DE")
                    : "—"}
                </td>
                <td style={tableCellStyle}>
                  {new Date(stock.updated_at).toLocaleString("de-DE")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
          <article
            key={product.id}
            style={{
              background: isLowStock
                ? "rgba(127, 29, 29, 0.18)"
                : "rgba(15, 23, 42, 0.78)",
              border: isLowStock
                ? "1px solid rgba(248, 113, 113, 0.35)"
                : "1px solid rgba(148, 163, 184, 0.18)",
              borderRadius: "20px",
              padding: "18px",
              boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
            }}
          >
            <h3 style={{ margin: "0 0 6px 0", color: "#f8fafc" }}>
              {product.name}
            </h3>

            <p style={{ margin: "0 0 10px 0", color: "#93c5fd" }}>
              {product.sku}
            </p>

            <div style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
              <div>
                Bestand: {product.quantity} {product.unit}
              </div>

              <div>Mindestbestand: {product.min_stock}</div>

              <div>
                Gewicht/Stück:{" "}
                {product.weight_kg
                  ? `${Number(product.weight_kg).toLocaleString("de-DE", {
                      maximumFractionDigits: 2,
                    })} kg`
                  : "—"}
              </div>

              <div>
                Lagerplatz:{" "}
                <strong>
                  {product.storage_location_label || "Kein Lagerplatz"}
                </strong>
              </div>

              {product.description && (
                <div>Beschreibung: {product.description}</div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                type="button"
                onClick={() => hasPermission("admin") && handleEdit(product)}
                disabled={!hasPermission("admin")}
                style={
                  hasPermission("admin")
                    ? secondaryButtonStyle
                    : disabledButtonStyle
                }
              >
                Bearbeiten
              </button>
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
        <button type="button" onClick={exportMovementsToCsv} style={secondaryButtonStyle}>Excel exportieren</button>
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
              <th style={tableHeadStyle}>Datum</th>
              <th style={tableHeadStyle}>Produkt</th>
              <th style={tableHeadStyle}>Typ</th>
              <th style={tableHeadStyle}>Menge</th>
              <th style={tableHeadStyle}>Referenz</th>
              <th style={tableHeadStyle}>Lagerplatz</th>
              <th style={tableHeadStyle}>Verpackung</th>
              <th style={tableHeadStyle}>Ladungsträger</th>
              <th style={tableHeadStyle}>Packmenge</th>
              <th style={tableHeadStyle}>Kosten</th>
              <th style={tableHeadStyle}>Notiz</th>
              <th style={tableHeadStyle}>Benutzer</th>
              <th style={tableHeadStyle}>Aktion</th>
            </tr>
            </thead>

            <tbody>
              {filteredMovements.map((movement, index) => {
                const isIn = movement.movement_type === "IN";
                const isLatest = index === 0;

                return (
                  <tr
                    key={movement.id}
                    style={{
                      borderTop: "1px solid rgba(148, 163, 184, 0.12)",
                      background: isIn
                        ? "rgba(22,101,52,0.08)"
                        : "rgba(127,29,29,0.08)",
                      transition: "0.2s",
                    }}
                  >
                    <td style={tableCellStyle}>
                      {new Date(movement.created_at).toLocaleString("de-DE")}
                    </td>

                    <td style={tableCellStyle}>{movement.product_name}</td>

                    <td style={tableCellStyle}>
                      <span
                        style={{
                          color: isIn ? "#86efac" : "#fca5a5",
                          fontWeight: 700,
                        }}
                      >
                        {isIn ? "Wareneingang" : "Warenausgang"}
                      </span>
                    </td>

                    <td style={tableCellStyle}>
                      {movement.movement_type === "OUT"
                        ? `-${movement.quantity}`
                        : movement.quantity}
                    </td>

                    <td
                      style={{
                        ...tableCellStyle,
                        color: movement.reference_number ? "#e5e7eb" : "#64748b",
                      }}
                    >
                      {movement.reference_number || "—"}
                    </td>

                    <td
                      style={{
                        ...tableCellStyle,
                        color: movement.storage_location_label ? "#e5e7eb" : "#64748b",
                      }}
                    >
                      {movement.storage_location_label || "—"}
                    </td>
                    <td
                    style={{
                      ...tableCellStyle,
                      color: movement.packaging_type_name ? "#e5e7eb" : "#64748b",
                    }}
                  >
                    {movement.packaging_type_name || "—"}
                  </td>

                  <td
                    style={{
                      ...tableCellStyle,
                      color: movement.load_carrier_type_name ? "#e5e7eb" : "#64748b",
                    }}
                  >
                    {movement.load_carrier_type_name || "—"}
                  </td>

                  <td
                    style={{
                      ...tableCellStyle,
                      color: movement.packaging_quantity ? "#e5e7eb" : "#64748b",
                    }}
                  >
                    {movement.packaging_quantity || "—"}
                  </td>

                  <td
                    style={{
                      ...tableCellStyle,
                      color: movement.packaging_cost_total ? "#e5e7eb" : "#64748b",
                      fontWeight: movement.packaging_cost_total ? 700 : 400,
                    }}
                  >
                    {movement.packaging_cost_total
                      ? `${Number(movement.packaging_cost_total).toLocaleString("de-DE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} €`
                      : "—"}
                  </td>

                    <td
                      style={{
                        ...tableCellStyle,
                        color: movement.note ? "#e5e7eb" : "#64748b",
                      }}
                    >
                      {movement.note || "—"}
                    </td>

                    <td
                      style={{
                        ...tableCellStyle,
                        color: movement.created_by_username ? "#e5e7eb" : "#64748b",
                      }}
                    >
                      {movement.created_by_username || "—"}
                    </td>

                    <td style={tableCellStyle}>
                      {isLatest && (
                        <button
                          type="button"
                          onClick={() =>
                            hasPermission("admin") && handleUndoMovement(movement)
                          }
                          disabled={!hasPermission("admin")}
                          style={
                            hasPermission("admin")
                              ? secondaryButtonStyle
                              : disabledButtonStyle
                          }
                        >
                          Rückgängig
                        </button>
                      )}
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

const dashboardChartCardStyle: CSSProperties = {
  background: "rgba(15, 23, 42, 0.78)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "18px",
  padding: "18px",
  boxShadow: "0 18px 36px rgba(0,0,0,0.2)",
};

const dashboardChartTitleStyle: CSSProperties = {
  margin: "0 0 14px 0",
  color: "#bfdbfe",
  fontSize: "1rem",
};

const dashboardChartLabelRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  color: "#e2e8f0",
  fontSize: "0.9rem",
  marginBottom: "6px",
};

const dashboardBarTrackStyle: CSSProperties = {
  width: "100%",
  height: "10px",
  borderRadius: "999px",
  background: "rgba(51, 65, 85, 0.75)",
  overflow: "hidden",
};

const dashboardBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #38bdf8, #2563eb)",
};

const dashboardDangerBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #fb7185, #dc2626)",
};

const dashboardWarningBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #fbbf24, #f97316)",
};

const dashboardMiniBarRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px 1fr",
  alignItems: "center",
  gap: "8px",
  marginTop: "5px",
};

const dashboardMiniBarLabelStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.75rem",
};

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
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  overflowX: "hidden",
  boxSizing: "border-box",
};

const pageStyleMobile: CSSProperties = {
  ...pageStyle,
  padding: "18px 12px",
};

const pageShellStyle: CSSProperties = {
  width: "100%",
  maxWidth: "none",
  margin: "0",
};

const appLayoutStyle: CSSProperties = {
  display: "block",
  width: "100%",
};

const sidebarStyle: CSSProperties = {
  position: "fixed",
  top: "100px",
  left: "50px",
  width: "300px",
  maxHeight: "calc(100vh - 220px)",
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
  width: "calc(100vw - 440px)",
  marginLeft: "380px",
  maxWidth: "none",
  boxSizing: "border-box",
};

const contentAreaMobileStyle: CSSProperties = {
  minWidth: 0,
  width: "100%",
  marginLeft: 0,
  maxWidth: "none",
  boxSizing: "border-box",
};

const appLayoutMobileStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "18px",
  alignItems: "start",
  width: "100%",
};


const sidebarMobileStyle: CSSProperties = {
  position: "relative",
  top: "auto",
  left: "auto",
  width: "100%",
  maxHeight: "none",
  overflowY: "visible",
  background: "rgba(25, 31, 48, 0.92)",
  border: "1px solid rgba(29, 110, 224, 0.22)",
  borderRadius: "20px",
  padding: "14px",
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
  flexWrap: "wrap",
  boxSizing: "border-box",
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
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
  width: "100%",
};

const filterGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
  marginBottom: "18px",
  alignItems: "center",
  width: "100%",
};

const productGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "16px",
  width: "100%",
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
  minWidth: "1250px",
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

export default App;