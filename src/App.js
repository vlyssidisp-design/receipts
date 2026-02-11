import React, { useEffect, useMemo, useState } from "react";

const styles = {
  page: { maxWidth: 980, margin: "0 auto", padding: 16, fontFamily: "system-ui, Arial" },
  topbar: { display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" },
  h1: { fontSize: 22, margin: "8px 0 12px" },
  card: { border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#fff" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 },
  btn: { padding: "10px 12px", borderRadius: 12, border: "1px solid #111827", background: "#111827", color: "#fff", cursor: "pointer" },
  btnGhost: { padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" },
  input: { width: "100%", padding: 10, borderRadius: 12, border: "1px solid #e5e7eb" },
  row: { display: "flex", gap: 10, flexWrap: "wrap" },
  label: { fontSize: 12, color: "#6b7280", marginBottom: 6 },
  small: { fontSize: 12, color: "#6b7280" },
  title: { fontWeight: 700, margin: 0 },
  pill: { display: "inline-block", padding: "4px 10px", borderRadius: 999, background: "#f3f4f6", fontSize: 12 },
  img: { maxWidth: "100%", borderRadius: 12, border: "1px solid #e5e7eb" },
};

const aiCategorize = (fileName = "") => {
  const name = fileName.toLowerCase();
  if (name.includes("dei") || name.includes("ρεύμα")) return { cat: "Λογαριασμοί", sub: "Ρεύμα" };
  if (name.includes("νερό") || name.includes("eydap")) return { cat: "Λογαριασμοί", sub: "Νερό" };
  if (name.includes("vodafone") || name.includes("cosmote")) return { cat: "Λογαριασμοί", sub: "Τηλέφωνο" };
  return null;
};

export default function App() {
  const [receipts, setReceipts] = useState([]);
  const [categories, setCategories] = useState({
    "Λογαριασμοί": ["Ρεύμα", "Νερό", "Τηλέφωνο", "Internet"],
    "Δάνεια": ["Στεγαστικό", "Καταναλωτικό", "Κάρτες"],
  });

  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentSubCategory, setCurrentSubCategory] = useState(null);

  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [preview, setPreview] = useState(null);

  const [search, setSearch] = useState("");

  useEffect(() => {
    const savedReceipts = localStorage.getItem("receiptsPersonal");
    const savedCategories = localStorage.getItem("categoriesPersonal");
    if (savedReceipts) setReceipts(JSON.parse(savedReceipts));
    if (savedCategories) setCategories(JSON.parse(savedCategories));
  }, []);

  useEffect(() => {
    localStorage.setItem("receiptsPersonal", JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem("categoriesPersonal", JSON.stringify(categories));
  }, [categories]);

  const totalAmount = useMemo(
    () => receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
    [receipts]
  );

  const upcomingPayments = useMemo(() => {
    const now = new Date();
    return receipts
      .filter((r) => r.dueDate && new Date(r.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 6);
  }, [receipts]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFileName(selected.name);
    setFileType(selected.type);

    const ai = aiCategorize(selected.name);
    if (ai) {
      setCurrentCategory(ai.cat);
      setCurrentSubCategory(ai.sub);
    }

    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null); // pdf: δεν κάνουμε preview εδώ (θα προσθέσουμε αργότερα)
    }
  };

  const addCategory = () => {
    const name = newCategory.trim();
    if (!name || categories[name]) return;
    setCategories({ ...categories, [name]: [] });
    setNewCategory("");
  };

  const addSubCategory = () => {
    const name = newSubCategory.trim();
    if (!name || !currentCategory) return;
    setCategories({
      ...categories,
      [currentCategory]: Array.from(new Set([...(categories[currentCategory] || []), name])),
    });
    setNewSubCategory("");
  };

  const addReceipt = () => {
    if (!currentCategory || !currentSubCategory) return;
    const t = title.trim() || (fileName ? fileName : "Απόδειξη");
    const newReceipt = {
      id: Date.now(),
      title: t,
      category: currentCategory,
      subCategory: currentSubCategory,
      amount: amount ? Number(amount) : 0,
      date,
      dueDate,
      fileName,
      fileType,
      filePreview: preview, // μόνο εικόνες
      createdAt: new Date().toISOString(),
    };
    setReceipts([newReceipt, ...receipts]);

    setTitle("");
    setAmount("");
    setDate("");
    setDueDate("");
    setFileName("");
    setFileType("");
    setPreview(null);
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ receipts, categories })], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "receipts-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.receipts) setReceipts(data.receipts);
        if (data.categories) setCategories(data.categories);
      } catch {}
    };
    reader.readAsText(f);
  };

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const okCat = r.category === currentCategory && r.subCategory === currentSubCategory;
      const okSearch = (r.title || "").toLowerCase().includes(search.toLowerCase());
      return okCat && okSearch;
    });
  }, [receipts, currentCategory, currentSubCategory, search]);

  // DASHBOARD
  if (!currentCategory) {
    return (
      <div style={styles.page}>
        <div style={styles.topbar}>
          <h1 style={styles.h1}>Οικονομικός Πίνακας</h1>
          <div style={styles.row}>
            <button style={styles.btnGhost} onClick={exportBackup}>Backup</button>
            <label style={{ ...styles.btnGhost, cursor: "pointer" }}>
              Restore
              <input type="file" accept="application/json" onChange={importBackup} style={{ display: "none" }} />
            </label>
          </div>
        </div>

        <div style={{ ...styles.card, marginBottom: 12 }}>
          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <div style={styles.small}>Συνολικά Έξοδα</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>€{totalAmount.toFixed(2)}</div>
            </div>
            <div style={{ flex: 2 }}>
              <div style={styles.small}>Επερχόμενες Πληρωμές</div>
              {upcomingPayments.length === 0 ? (
                <div style={styles.small}>—</div>
              ) : (
                upcomingPayments.map((r) => (
                  <div key={r.id} style={styles.small}>
                    • {r.title} — {r.dueDate}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={{ ...styles.card, marginBottom: 12 }}>
          <div style={styles.label}>Νέα Κατηγορία</div>
          <div style={styles.row}>
            <input style={{ ...styles.input, flex: 1 }} value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="π.χ. Αυτοκίνητο" />
            <button style={styles.btn} onClick={addCategory}>Προσθήκη</button>
          </div>
        </div>

        <div style={styles.grid}>
          {Object.keys(categories).map((cat) => (
            <div key={cat} style={{ ...styles.card, cursor: "pointer" }} onClick={() => setCurrentCategory(cat)}>
              <p style={styles.title}>{cat}</p>
              <span style={styles.pill}>{(categories[cat] || []).length} υποκατηγορίες</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // SUBCATEGORIES
  if (!currentSubCategory) {
    return (
      <div style={styles.page}>
        <div style={styles.topbar}>
          <button style={styles.btnGhost} onClick={() => setCurrentCategory(null)}>⬅ Πίσω</button>
          <h1 style={styles.h1}>{currentCategory}</h1>
        </div>

        <div style={{ ...styles.card, marginBottom: 12 }}>
          <div style={styles.label}>Νέα Υποκατηγορία</div>
          <div style={styles.row}>
            <input style={{ ...styles.input, flex: 1 }} value={newSubCategory} onChange={(e) => setNewSubCategory(e.target.value)} placeholder="π.χ. ΔΕΗ πάγιο" />
            <button style={styles.btn} onClick={addSubCategory}>Προσθήκη</button>
          </div>
        </div>

        <div style={styles.grid}>
          {(categories[currentCategory] || []).map((sub) => (
            <div key={sub} style={{ ...styles.card, cursor: "pointer" }} onClick={() => setCurrentSubCategory(sub)}>
              <p style={styles.title}>{sub}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // RECEIPTS LIST
  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <button style={styles.btnGhost} onClick={() => setCurrentSubCategory(null)}>⬅ Πίσω</button>
        <h1 style={styles.h1}>{currentCategory} / {currentSubCategory}</h1>
      </div>

      <div style={{ ...styles.card, marginBottom: 12 }}>
        <div style={styles.row}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={styles.label}>Τίτλος</div>
            <input style={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="π.χ. ΔΕΗ Ιανουάριος" />
          </div>
          <div style={{ width: 160 }}>
            <div style={styles.label}>Ποσό (€)</div>
            <input style={styles.input} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div style={{ width: 170 }}>
            <div style={styles.label}>Ημ/νία</div>
            <input style={styles.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div style={{ width: 170 }}>
            <div style={styles.label}>Λήξη</div>
            <input style={styles.input} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={styles.label}>Αρχείο (εικόνα ή PDF)</div>
          <input type="file" accept="image/*,.pdf" onChange={handleFileChange} />
          <div style={styles.small}>
            {fileName ? `Επιλεγμένο: ${fileName}` : "—"}
          </div>
          {preview && <img alt="preview" src={preview} style={{ ...styles.img, marginTop: 10, maxHeight: 240 }} />}
        </div>

        <div style={{ marginTop: 12 }}>
          <button style={styles.btn} onClick={addReceipt}>Προσθήκη Απόδειξης</button>
        </div>
      </div>

      <div style={{ ...styles.card, marginBottom: 12 }}>
        <div style={styles.label}>Αναζήτηση</div>
        <input style={styles.input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="γράψε τίτλο..." />
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {filteredReceipts.map((r) => (
          <div key={r.id} style={styles.card}>
            <div style={styles.row}>
              <div style={{ flex: 1 }}>
                <p style={styles.title}>{r.title}</p>
                <div style={styles.small}>
                  Ποσό: €{Number(r.amount || 0).toFixed(2)} • Λήξη: {r.dueDate || "—"}
                </div>
                <div style={styles.small}>
                  Αρχείο: {r.fileName || "—"} {r.fileType ? `(${r.fileType})` : ""}
                </div>
              </div>
              <span style={styles.pill}>{r.category} / {r.subCategory}</span>
            </div>

            {r.filePreview && (
              <div style={{ marginTop: 10 }}>
                <img alt="receipt" src={r.filePreview} style={{ ...styles.img, maxHeight: 260 }} />
              </div>
            )}
          </div>
        ))}
        {filteredReceipts.length === 0 && <div style={styles.small}>Δεν υπάρχουν αποδείξεις εδώ ακόμα.</div>}
      </div>
    </div>
  );
}
