import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FiPause, FiPercent, FiPlay, FiPlus, FiTag } from "react-icons/fi";
import "./Promotions.css";

const defaultForm = () => {
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const toLocalInput = (date) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };
  return {
    title: "",
    message: "",
    discountType: "percentage",
    discountValue: "",
    applicationType: "code",
    code: "",
    minimumOrderAmount: "0",
    startsAt: toLocalInput(startsAt),
    endsAt: toLocalInput(endsAt),
    isActive: true,
  };
};

const fromPromotion = (promotion) => ({
  ...promotion,
  discountValue: String(promotion.discountValue),
  minimumOrderAmount: String(promotion.minimumOrderAmount || 0),
  startsAt: toLocalInput(new Date(promotion.startsAt)),
  endsAt: toLocalInput(new Date(promotion.endsAt)),
});

function toLocalInput(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

const getStatus = (promotion) => {
  const now = Date.now();
  if (!promotion.isActive) return "Paused";
  if (new Date(promotion.startsAt).getTime() > now) return "Scheduled";
  if (new Date(promotion.endsAt).getTime() <= now) return "Expired";
  return "Active";
};

const Promotions = ({ url, adminKey }) => {
  const [promotions, setPromotions] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const requestConfig = useMemo(
    () => ({
      headers: { "x-admin-key": adminKey },
    }),
    [adminKey],
  );

  const fetchPromotions = useCallback(async () => {
    const response = await axios.get(`${url}/api/order/admin/promotions`, requestConfig);
    if (!response.data?.success || !Array.isArray(response.data.data)) {
      throw new Error(response.data?.message || "Invalid promotions response.");
    }
    return response.data.data;
  }, [url, requestConfig]);

  useEffect(() => {
    let current = true;
    fetchPromotions()
      .then((data) => {
        if (current) setPromotions(data);
      })
      .catch((error) => {
        if (current) {
          toast.error(error.response?.data?.message || error.message || "We couldn't load promotions.");
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [fetchPromotions]);

  const changeField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const resetForm = () => {
    setForm(defaultForm());
    setEditingId("");
  };

  const savePromotion = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      discountValue: Number(form.discountValue),
      minimumOrderAmount: Number(form.minimumOrderAmount),
      ...(form.applicationType === "code" ? { code: form.code.trim().toUpperCase() } : {}),
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
    };
    try {
      const response = editingId
        ? await axios.patch(`${url}/api/order/admin/promotions/${editingId}`, payload, requestConfig)
        : await axios.post(`${url}/api/order/admin/promotions`, payload, requestConfig);
      if (!response.data?.success) {
        throw new Error(response.data?.message || "We couldn't save this promotion.");
      }
      toast.success(editingId ? "Promotion updated." : "Promotion created.");
      resetForm();
      setPromotions(await fetchPromotions());
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "We couldn't save this promotion.");
    } finally {
      setSaving(false);
    }
  };

  const editPromotion = (promotion) => {
    setEditingId(promotion._id);
    setForm(fromPromotion(promotion));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const togglePromotion = async (promotion) => {
    try {
      const payload = { ...promotion, isActive: !promotion.isActive };
      const response = await axios.patch(
        `${url}/api/order/admin/promotions/${promotion._id}`,
        payload,
        requestConfig,
      );
      if (!response.data?.success) {
        throw new Error(response.data?.message || "We couldn't update this promotion.");
      }
      toast.success(payload.isActive ? "Promotion activated." : "Promotion paused.");
      setPromotions(await fetchPromotions());
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "We couldn't update this promotion.");
    }
  };

  return (
    <main className="promotions-page">
      <header className="promotions-header">
        <span className="promotions-eyebrow">MARKETING WORKSPACE</span>
        <h1>Promotions & discounts</h1>
        <p>Create timed offers, promo codes, and automatic discounts. Customers see active offers on the storefront.</p>
      </header>

      <div className="promotions-layout">
        <section className="promotion-form-card">
          <div className="promotion-card-heading">
            <span className="promotion-card-icon"><FiPlus /></span>
            <div>
              <h2>{editingId ? "Edit promotion" : "Create a promotion"}</h2>
              <p>Offers are checked again by the server at checkout.</p>
            </div>
          </div>
          <form onSubmit={savePromotion} className="promotion-form">
            <label>
              <span>Offer title</span>
              <input name="title" value={form.title} onChange={changeField} maxLength="80" required placeholder="e.g. Weekend special" />
            </label>
            <label>
              <span>Storefront notification</span>
              <textarea name="message" value={form.message} onChange={changeField} maxLength="180" required placeholder="Tell customers what makes this offer special." rows="3" />
            </label>
            <div className="promotion-form-row">
              <label>
                <span>Discount type</span>
                <select name="discountType" value={form.discountType} onChange={changeField}>
                  <option value="percentage">Percentage off</option>
                  <option value="fixed">Fixed amount off ($)</option>
                </select>
              </label>
              <label>
                <span>{form.discountType === "percentage" ? "Discount (%)" : "Discount ($)"}</span>
                <input name="discountValue" type="number" min="0.01" max={form.discountType === "percentage" ? "100" : undefined} step="0.01" value={form.discountValue} onChange={changeField} required />
              </label>
            </div>
            <label>
              <span>How customers get the discount</span>
              <select name="applicationType" value={form.applicationType} onChange={changeField}>
                <option value="code">Enter a promo code</option>
                <option value="automatic">Automatic at checkout</option>
              </select>
            </label>
            {form.applicationType === "code" && (
              <label>
                <span>Promo code</span>
                <input name="code" value={form.code} onChange={changeField} minLength="3" maxLength="24" pattern="[A-Za-z0-9-]+" required placeholder="e.g. WELCOME10" />
              </label>
            )}
            <label>
              <span>Minimum order subtotal ($)</span>
              <input name="minimumOrderAmount" type="number" min="0" step="0.01" value={form.minimumOrderAmount} onChange={changeField} required />
            </label>
            <div className="promotion-form-row">
              <label>
                <span>Starts</span>
                <input name="startsAt" type="datetime-local" value={form.startsAt} onChange={changeField} required />
              </label>
              <label>
                <span>Ends</span>
                <input name="endsAt" type="datetime-local" value={form.endsAt} onChange={changeField} required />
              </label>
            </div>
            <label className="promotion-active-toggle">
              <input name="isActive" type="checkbox" checked={form.isActive} onChange={changeField} />
              <span>Promotion is enabled</span>
            </label>
            <div className="promotion-form-actions">
              {editingId && <button className="promotion-secondary-button" type="button" onClick={resetForm}>Cancel edit</button>}
              <button className="promotion-save-button" type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Save changes" : "Create promotion"}
              </button>
            </div>
          </form>
        </section>

        <section className="promotion-list-card">
          <div className="promotion-card-heading">
            <span className="promotion-card-icon"><FiTag /></span>
            <div>
              <h2>Your offers</h2>
              <p>Pause or edit offers whenever you need.</p>
            </div>
          </div>
          {loading ? (
            <p className="promotion-list-message">Loading promotions…</p>
          ) : promotions.length ? (
            <div className="promotion-list">
              {promotions.map((promotion) => {
                const status = getStatus(promotion);
                return (
                  <article className="promotion-list-item" key={promotion._id}>
                    <div className="promotion-list-item-top">
                      <span className="promotion-list-icon"><FiPercent /></span>
                      <span className={`promotion-status ${status.toLowerCase()}`}>{status}</span>
                    </div>
                    <h3>{promotion.title}</h3>
                    <p>{promotion.message}</p>
                    <div className="promotion-list-details">
                      <b>{promotion.discountType === "percentage" ? `${promotion.discountValue}% off` : `$${Number(promotion.discountValue).toFixed(2)} off`}</b>
                      <span>{promotion.applicationType === "code" ? `Code: ${promotion.code}` : "Automatic discount"}</span>
                      <span>Min. order ${Number(promotion.minimumOrderAmount || 0).toFixed(2)}</span>
                      <span>Ends {new Date(promotion.endsAt).toLocaleString()}</span>
                    </div>
                    <div className="promotion-item-actions">
                      <button type="button" onClick={() => editPromotion(promotion)}>Edit</button>
                      <button type="button" onClick={() => togglePromotion(promotion)} aria-label={`${promotion.isActive ? "Pause" : "Activate"} ${promotion.title}`}>
                        {promotion.isActive ? <><FiPause /> Pause</> : <><FiPlay /> Activate</>}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="promotion-list-message">No promotions yet. Create your first offer here.</p>
          )}
        </section>
      </div>
    </main>
  );
};

export default Promotions;
