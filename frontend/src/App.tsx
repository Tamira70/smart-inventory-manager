import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
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

type ProductForm = {
  name: string;
  sku: string;
  description: string;
  quantity: string;
  min_stock: string;
  unit: string;
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

function App() {
  const user = getUser();
  const role = user?.role ?? "viewer";

  const [activeSection, setActiveSection] = useState<
    "product" | "goods-in" | "goods-out"
  >("product");

  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementProductFilter, setMovementProductFilter] = useState("");

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
  const [movementTypeFilter, setMovementTypeFilter] = useState<
    "" | "IN" | "OUT"
  >("");

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

  const hasPermission = (required: "admin" | "lager") => {
    if (!role) return false;
    if (required === "admin") return role === "admin";
    if (required === "lager") return role === "admin" || role === "lager";
    return false;
  };

  useEffect(() => {
    if (activeSection === "product") {
      productNameRef.current?.focus();
    } else if (activeSection === "goods-in") {
      goodsInProductRef.current?.focus();
    } else if (activeSection === "goods-out") {
      goodsOutProductRef.current?.focus();
    }
  }, [activeSection]);

  const focusNextOnEnter = (
    event: React.KeyboardEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    next?: HTMLElement | null
  ) => {
    if (
      event.key === "Enter" &&
      !(event.target instanceof HTMLTextAreaElement)
    ) {
      event.preventDefault();
      next?.focus();
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/inventory-api/products/");
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Fehler beim Laden.";
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
      const data = await response.json();
      setMovements(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Fehler beim Laden der Bewegungen.";
      setError(message);
    } finally {
      setMovementsLoading(false);
    }
  };

  useEffect(() => {
    if (loggedIn) {
      loadProducts();
      loadMovements();
    }
  }, [loggedIn]);

  const lowStockProducts = useMemo(() => {
    return products.filter((product) => product.quantity <= product.min_stock);
  }, [products]);

  const filteredMovements = useMemo(() => {
    const query = movementSearch.trim().toLowerCase();

    return movements.filter((movement) => {
      const matchesSearch =
        movement.product_name.toLowerCase().includes(query) ||
        (movement.reference_number ?? "").toLowerCase().includes(query) ||
        (movement.note ?? "").toLowerCase().includes(query);

      const matchesType =
        movementTypeFilter === "" ||
        movement.movement_type === movementTypeFilter;

      const matchesProduct =
        movementProductFilter === "" ||
        movement.product_name === movementProductFilter;

      return matchesSearch && matchesType && matchesProduct;
    });
  }, [
    movements,
    movementSearch,
    movementTypeFilter,
    movementProductFilter,
  ]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);

      const matchesLowStock =
        !showLowStockOnly || product.quantity <= product.min_stock;

      return matchesSearch && matchesLowStock;
    });
  }, [products, search, showLowStockOnly]);

  const totalProducts = products.length;
  const totalUnits = products.reduce((sum, product) => sum + product.quantity, 0);

  const handleLogout = () => {
    clearTokens();
    setLoggedIn(false);
    setProducts([]);
    setMovements([]);
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
    if (form.quantity === "" || Number(form.quantity) < 0) {
      return "Bestand muss 0 oder größer sein.";
    }
    if (form.min_stock === "" || Number(form.min_stock) < 0) {
      return "Mindestbestand muss 0 oder größer sein.";
    }
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
        editingId === null
          ? "/inventory-api/products/"
          : `/inventory-api/products/${editingId}/`,
        {
          method: editingId === null ? "POST" : "PUT",
          body: JSON.stringify(payload),
        }
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
      const message =
        err instanceof Error ? err.message : "Fehler beim Speichern.";

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
      const message =
        err instanceof Error ? err.message : "Fehler beim Rückgängig machen.";
      setError(message);
    }
  };

  const validateGoodsReceiptForm = () => {
    if (!movementProductId) {
      return "Bitte ein Produkt für den Wareneingang auswählen.";
    }
    if (movementQuantity === "" || Number(movementQuantity) <= 0) {
      return "Die Wareneingangs-Menge muss größer als 0 sein.";
    }
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
      const message =
        err instanceof Error ? err.message : "Fehler beim Wareneingang.";

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
    if (!goodsOutProductId) {
      return "Bitte ein Produkt für den Warenausgang auswählen.";
    }
    if (goodsOutQuantity === "" || Number(goodsOutQuantity) <= 0) {
      return "Die Warenausgangs-Menge muss größer als 0 sein.";
    }
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
      const message =
        err instanceof Error ? err.message : "Fehler beim Warenausgang.";

      setError(message);
      if (message.includes("Sitzung abgelaufen")) {
        clearTokens();
        setLoggedIn(false);
      }
    } finally {
      setGoodsOutSaving(false);
    }
  };

  const exportMovementsToCsv = () => {
    const headers = [
      "Datum",
      "Produkt",
      "Typ",
      "Menge",
      "Referenz",
      "Notiz",
      "Benutzer",
    ];

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
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(";")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bewegungshistorie.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!loggedIn) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg, #0f172a 0%, #111827 45%, #0b1120 100%)",
          color: "#e5e7eb",
          padding: "32px 20px",
        }}
      >
        <LoginForm onLoginSuccess={() => setLoggedIn(true)} />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #0f172a 0%, #111827 45%, #0b1120 100%)",
        color: "#e5e7eb",
        padding: "32px 20px",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 10px 0",
                color: "#93c5fd",
                fontSize: "0.95rem",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Portfolio Project
            </p>

            <h1
              style={{
                margin: 0,
                fontSize: "2.5rem",
                lineHeight: 1.1,
                color: "#f5f7fa",
              }}
            >
              📦 Smart Inventory Manager
            </h1>

            <p style={{ marginTop: "12px", color: "#cbd5e1", maxWidth: "760px" }}>
              Geschütztes Dashboard mit JWT-Login und Produktverwaltung.
            </p>

            <p style={{ marginTop: "8px", color: "#94a3b8" }}>
              Eingeloggt als: <strong>{user?.username}</strong> | Rolle:{" "}
              <strong>{role}</strong>
            </p>

            {role === "viewer" && (
              <p style={infoStyle}>
                🔒 Viewer-Modus aktiv: Bearbeiten und Buchungen sind deaktiviert.
              </p>
            )}

            {role === "lager" && (
              <p style={infoStyle}>
                📦 Lager-Modus aktiv: Du kannst Wareneingang und Warenausgang
                buchen, aber keine Produkte anlegen.
              </p>
            )}

            {role === "admin" && (
              <p style={infoStyle}>
                ⚙️ Admin-Modus aktiv: Du hast vollen Zugriff auf alle Funktionen.
              </p>
            )}
          </div>

          <button onClick={handleLogout} style={secondaryButtonStyle}>
            Logout
          </button>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <Card title="Produkte gesamt" value={String(totalProducts)} />
          <Card title="Bestand gesamt" value={String(totalUnits)} />
          <Card
            title="Niedriger Bestand"
            value={String(lowStockProducts.length)}
            danger
          />
        </section>

        <section
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveSection("product")}
            disabled={!hasPermission("admin")}
            style={
              hasPermission("admin")
                ? activeSection === "product"
                  ? primaryButtonStyle
                  : secondaryButtonStyle
                : disabledButtonStyle
            }
            title={!hasPermission("admin") ? "Nur Admin darf Produkte anlegen" : ""}
          >
            Neues Produkt anlegen
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("goods-in")}
            disabled={!hasPermission("lager")}
            style={
              hasPermission("lager")
                ? activeSection === "goods-in"
                  ? primaryButtonStyle
                  : secondaryButtonStyle
                : disabledButtonStyle
            }
            title={!hasPermission("lager") ? "Keine Berechtigung" : ""}
          >
            Wareneingang buchen
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("goods-out")}
            disabled={!hasPermission("lager")}
            style={
              hasPermission("lager")
                ? activeSection === "goods-out"
                  ? primaryButtonStyle
                  : secondaryButtonStyle
                : disabledButtonStyle
            }
            title={!hasPermission("lager") ? "Keine Berechtigung" : ""}
          >
            Warenausgang buchen
          </button>
        </section>

        {activeSection === "product" && (
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Neues Produkt anlegen</h2>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              <input
                ref={productNameRef}
                name="name"
                placeholder="Produktname"
                value={form.name}
                onChange={handleChange}
                onKeyDown={(e) => focusNextOnEnter(e, productSkuRef.current)}
                style={inputStyle}
                disabled={!hasPermission("admin")}
              />

              <input
                ref={productSkuRef}
                name="sku"
                placeholder="SKU"
                value={form.sku}
                onChange={handleChange}
                onKeyDown={(e) => focusNextOnEnter(e, productQuantityRef.current)}
                style={inputStyle}
                disabled={!hasPermission("admin")}
              />

              <input
                ref={productQuantityRef}
                name="quantity"
                type="number"
                placeholder="Bestand"
                value={form.quantity}
                onChange={handleChange}
                onKeyDown={(e) => focusNextOnEnter(e, productMinStockRef.current)}
                min="0"
                style={inputStyle}
                disabled={!hasPermission("admin")}
              />

              <input
                ref={productMinStockRef}
                name="min_stock"
                type="number"
                placeholder="Mindestbestand"
                value={form.min_stock}
                onChange={handleChange}
                onKeyDown={(e) => focusNextOnEnter(e, productUnitRef.current)}
                min="0"
                style={inputStyle}
                disabled={!hasPermission("admin")}
              />

              <select
                ref={productUnitRef}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                onKeyDown={(e) =>
                  focusNextOnEnter(e, productDescriptionRef.current)
                }
                style={inputStyle}
                disabled={!hasPermission("admin")}
              >
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>

              <textarea
                ref={productDescriptionRef}
                name="description"
                placeholder="Beschreibung"
                value={form.description}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  minHeight: "100px",
                  gridColumn: "1 / -1",
                }}
                disabled={!hasPermission("admin")}
              />

              <button
                type="submit"
                disabled={saving || !hasPermission("admin")}
                style={
                  hasPermission("admin")
                    ? { ...primaryButtonStyle, gridColumn: "1 / -1" }
                    : {
                        ...primaryButtonStyle,
                        gridColumn: "1 / -1",
                        opacity: 0.4,
                        cursor: "not-allowed",
                      }
                }
                title={!hasPermission("admin") ? "Keine Berechtigung" : ""}
              >
                {saving ? "Speichere..." : "Produkt speichern"}
              </button>
            </form>
          </section>
        )}

        {activeSection === "goods-in" && (
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>📥 Wareneingang buchen</h2>

            <form
              onSubmit={handleGoodsReceipt}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              <select
                ref={goodsInProductRef}
                value={movementProductId}
                onChange={(e) => setMovementProductId(e.target.value)}
                onKeyDown={(e) => focusNextOnEnter(e, goodsInQuantityRef.current)}
                required
                style={inputStyle}
                disabled={!hasPermission("lager")}
              >
                <option value="">Produkt auswählen</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>

              <input
                ref={goodsInQuantityRef}
                type="number"
                placeholder="Menge"
                value={movementQuantity}
                onChange={(e) => setMovementQuantity(e.target.value)}
                required
                min="1"
                style={inputStyle}
                disabled={!hasPermission("lager")}
              />

              <input
                type="text"
                placeholder="Lieferschein / Referenznummer"
                value={movementReferenceNumber}
                onChange={(e) => setMovementReferenceNumber(e.target.value)}
                style={inputStyle}
                disabled={!hasPermission("lager")}
              />

              <textarea
                placeholder="Notiz"
                value={movementNote}
                onChange={(e) => setMovementNote(e.target.value)}
                style={{
                  ...inputStyle,
                  minHeight: "48px",
                  gridColumn: "1 / -1",
                }}
                disabled={!hasPermission("lager")}
              />

              <div style={{ gridColumn: "1 / -1" }}>
                <button
                  type="submit"
                  disabled={movementSaving || !hasPermission("lager")}
                  style={
                    hasPermission("lager")
                      ? primaryButtonStyle
                      : {
                          ...primaryButtonStyle,
                          opacity: 0.4,
                          cursor: "not-allowed",
                        }
                  }
                  title={!hasPermission("lager") ? "Keine Berechtigung" : ""}
                >
                  {movementSaving ? "Buche..." : "Wareneingang buchen"}
                </button>
              </div>
            </form>
          </section>
        )}

        {activeSection === "goods-out" && (
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>📤 Warenausgang buchen</h2>

            <form
              onSubmit={handleGoodsIssue}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              <select
                ref={goodsOutProductRef}
                value={goodsOutProductId}
                onChange={(e) => setGoodsOutProductId(e.target.value)}
                onKeyDown={(e) =>
                  focusNextOnEnter(e, goodsOutQuantityRef.current)
                }
                required
                style={inputStyle}
                disabled={!hasPermission("lager")}
              >
                <option value="">Produkt auswählen</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>

              <input
                ref={goodsOutQuantityRef}
                type="number"
                placeholder="Menge"
                value={goodsOutQuantity}
                onChange={(e) => setGoodsOutQuantity(e.target.value)}
                required
                min="1"
                style={inputStyle}
                disabled={!hasPermission("lager")}
              />

              <input
                type="text"
                placeholder="Referenznummer"
                value={goodsOutReferenceNumber}
                onChange={(e) => setGoodsOutReferenceNumber(e.target.value)}
                style={inputStyle}
                disabled={!hasPermission("lager")}
              />

              <textarea
                placeholder="Notiz"
                value={goodsOutNote}
                onChange={(e) => setGoodsOutNote(e.target.value)}
                style={{
                  ...inputStyle,
                  minHeight: "48px",
                  gridColumn: "1 / -1",
                }}
                disabled={!hasPermission("lager")}
              />

              <div style={{ gridColumn: "1 / -1" }}>
                <button
                  type="submit"
                  disabled={goodsOutSaving || !hasPermission("lager")}
                  style={
                    hasPermission("lager")
                      ? primaryButtonStyle
                      : {
                          ...primaryButtonStyle,
                          opacity: 0.4,
                          cursor: "not-allowed",
                        }
                  }
                  title={!hasPermission("lager") ? "Keine Berechtigung" : ""}
                >
                  {goodsOutSaving ? "Buche..." : "Warenausgang buchen"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Suche & Filter</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder="Suche nach Name, SKU oder Beschreibung"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={inputStyle}
            />

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#e5e7eb",
                whiteSpace: "nowrap",
              }}
            >
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
              />
              Nur Niedriger Lagerbestand
            </label>
          </div>
        </section>

        {loading && <p>Lade Produkte...</p>}
        {error && <p style={errorStyle}>Fehler: {error}</p>}
        {success && <p style={successStyle}>{success}</p>}

        {!loading && !error && filteredProducts.length === 0 && (
          <p>Keine Produkte passen zur aktuellen Suche oder zum Filter.</p>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredProducts.map((product) => {
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
                    {product.description && (
                      <div>Beschreibung: {product.description}</div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "16px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => hasPermission("admin") && handleEdit(product)}
                      disabled={!hasPermission("admin")}
                      style={
                        hasPermission("admin")
                          ? secondaryButtonStyle
                          : disabledButtonStyle
                      }
                      title={!hasPermission("admin") ? "Keine Berechtigung" : ""}
                    >
                      Bearbeiten
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Bewegungshistorie</h2>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "16px",
            }}
          >
            <button
              type="button"
              onClick={exportMovementsToCsv}
              style={secondaryButtonStyle}
            >
              CSV exportieren
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 220px 260px",
              gap: "12px",
              marginBottom: "18px",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder="Suche nach Produkt, Referenz oder Notiz"
              value={movementSearch}
              onChange={(e) => setMovementSearch(e.target.value)}
              style={inputStyle}
            />

            <select
              value={movementTypeFilter}
              onChange={(e) =>
                setMovementTypeFilter(e.target.value as "" | "IN" | "OUT")
              }
              style={inputStyle}
            >
              <option value="">Alle Bewegungen</option>
              <option value="IN">Nur Wareneingang</option>
              <option value="OUT">Nur Warenausgang</option>
            </select>

            <select
              value={movementProductFilter}
              onChange={(e) => setMovementProductFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="">Alle Produkte</option>
              {[...new Set(products.map((product) => product.name))].map(
                (productName) => (
                  <option key={productName} value={productName}>
                    {productName}
                  </option>
                )
              )}
            </select>
          </div>

          {movementsLoading && <p>Lade Bewegungen...</p>}

          {!movementsLoading && filteredMovements.length === 0 && (
            <p>Keine Bewegungen gefunden.</p>
          )}

          {!movementsLoading && filteredMovements.length > 0 && (
            <div
              style={{
                overflowX: "auto",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                borderRadius: "14px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "900px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "rgba(30, 41, 59, 0.7)",
                      textAlign: "left",
                    }}
                  >
                    <th style={tableHeadStyle}>Datum</th>
                    <th style={tableHeadStyle}>Produkt</th>
                    <th style={tableHeadStyle}>Typ</th>
                    <th style={tableHeadStyle}>Menge</th>
                    <th style={tableHeadStyle}>Referenz</th>
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
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(255,255,255,0.05)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = isIn
                            ? "rgba(22,101,52,0.08)"
                            : "rgba(127,29,29,0.08)")
                        }
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
                            color: movement.reference_number
                              ? "#e5e7eb"
                              : "#64748b",
                          }}
                        >
                          {movement.reference_number || "—"}
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
                            color: movement.created_by_username
                              ? "#e5e7eb"
                              : "#64748b",
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
                              title={!hasPermission("admin") ? "Keine Berechtigung" : ""}
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
      </div>
    </div>
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
      }}
    >
      <div style={{ color: danger ? "#fca5a5" : "#94a3b8", marginBottom: "8px" }}>
        {title}
      </div>
      <div
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          color: danger ? "#fecaca" : "#f8fafc",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const infoStyle: React.CSSProperties = {
  marginTop: "10px",
  padding: "10px 12px",
  borderRadius: "10px",
  background: "rgba(59, 130, 246, 0.15)",
  border: "1px solid rgba(96, 165, 250, 0.3)",
  color: "#bfdbfe",
};

const tableHeadStyle: React.CSSProperties = {
  padding: "12px 14px",
  color: "#ededee",
  fontSize: "0.95rem",
  fontWeight: 700,
};

const tableCellStyle: React.CSSProperties = {
  padding: "12px 14px",
  color: "#e9ecf3",
  verticalAlign: "top",
};

const sectionStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.8)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  marginBottom: "28px",
};

const sectionTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: "18px",
  color: "#8cbfd6",
  fontSize: "2rem",
  textAlign: "center",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  background: "rgba(15, 23, 42, 0.72)",
  color: "#f8fafc",
  outline: "none",
  boxSizing: "border-box",
};

const primaryButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "12px",
  padding: "12px 16px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 600,
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "12px",
  padding: "12px 16px",
  background: "rgba(30, 41, 59, 0.85)",
  color: "#e5e7eb",
  cursor: "pointer",
  fontWeight: 600,
};

const disabledButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  opacity: 0.4,
  cursor: "not-allowed",
};

const errorStyle: React.CSSProperties = {
  color: "#f87474",
  background: "rgba(127, 29, 29, 0.18)",
  border: "1px solid rgba(248, 113, 113, 0.25)",
  borderRadius: "10px",
  padding: "10px 12px",
  marginBottom: "16px",
};

const successStyle: React.CSSProperties = {
  color: "#86efac",
  background: "rgba(22, 101, 52, 0.18)",
  border: "1px solid rgba(34, 197, 94, 0.25)",
  borderRadius: "10px",
  padding: "10px 12px",
  marginBottom: "16px",
};

export default App;