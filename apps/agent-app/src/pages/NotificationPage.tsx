import React, { useEffect, useMemo, useState } from "react";
import { useAgentNotifications } from "../hooks/useAgentNotifications";

interface ReceiptItem {
  id: string; productName: string; size?: string | null; weight?: number | null;
  quantity: number; unitPrice: number; lineTotal: number;
}
interface OrderReceipt {
  orderNumber: string; status: string;
  customer: { name: string; phone?: string | null; email?: string | null };
  delivery: { address?: string | null; city?: string | null };
  station: { name: string; address?: string | null };
  driver: { name?: string | null; phone?: string | null; vehicleNumber?: string | null; vehicleType?: string | null };
  payment: { method?: string; status?: string };
  orderedAt?: string; deliveredAt?: string | null;
  items: ReceiptItem[]; totalQuantity: number; totalAmount: number;
}
interface NotificationRecord {
  id: string; type: string; title: string; message: string;
  isRead: boolean; createdAt: string; orderId?: string | null; data?: any;
}
const GREEN_BACKGROUND = "radial-gradient(ellipse at 54% 27%, rgba(0,164,73,.48) 0%, rgba(0,96,49,.30) 36%, transparent 72%), linear-gradient(145deg,#00170C 0%,#00351E 52%,#00140B 100%)";
const money = (value:number) => "UGX " + Number(value || 0).toLocaleString("en-UG",{maximumFractionDigits:0});
const dateTime = (value?:string|null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-UG",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
};
const shortId = (value?:string|null) => value ? "#" + value.slice(0,8).toUpperCase() : "—";

function Detail({label,value}:{label:string;value?:string|null}) {
  return <div style={styles.detail}><span>{label}</span><strong>{value || "—"}</strong></div>;
}
function ReceiptPanel({receipt,notification}:{receipt?:OrderReceipt;notification:NotificationRecord}) {
  if (!receipt) return <div style={styles.fallback}><strong>Order receipt details</strong><p>Order: {shortId(notification.orderId)}</p><small>Product line details are not available for this order record.</small></div>;
  return (
    <div style={styles.receipt}>
      <div style={styles.receiptHeader}>
        <div><small style={styles.eyebrow}>GASMOBIL ORDER RECEIPT</small><h3 style={styles.orderNumber}>{shortId(receipt.orderNumber)}</h3></div>
        <span style={styles.status}>{String(receipt.status||"pending").replace(/_/g," ").toUpperCase()}</span>
      </div>
      <div style={styles.infoGrid}>
        <div style={styles.infoColumn}>
          <Detail label="Customer" value={receipt.customer.name}/>
          <Detail label="Phone" value={receipt.customer.phone}/>
          <Detail label="Email" value={receipt.customer.email}/>
          <Detail label="Address" value={receipt.delivery.address}/>
          <Detail label="City" value={receipt.delivery.city}/>
        </div>
        <div style={styles.infoColumn}>
          <Detail label="Driver" value={receipt.driver.name || "Not assigned"}/>
          <Detail label="Driver phone" value={receipt.driver.phone}/>
          <Detail label="Vehicle" value={[receipt.driver.vehicleType,receipt.driver.vehicleNumber].filter(Boolean).join(" · ")}/>
          <Detail label="Station" value={receipt.station.name}/>
          <Detail label="Payment" value={(receipt.payment.method||"cash").toUpperCase()+" · "+(receipt.payment.status||"pending").toUpperCase()}/>
          <Detail label="Ordered" value={dateTime(receipt.orderedAt)}/>
          <Detail label="Delivered" value={dateTime(receipt.deliveredAt)}/>
        </div>
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead><tr style={{background:"#F1F4EF",color:"#0B3D2E"}}><th style={{textAlign:"left",padding:"10px 12px"}}>Product</th><th style={{padding:"10px 12px"}}>Qty</th><th style={{textAlign:"right",padding:"10px 12px"}}>Unit price</th><th style={{textAlign:"right",padding:"10px 12px"}}>Line total</th></tr></thead>
          <tbody>
            {receipt.items.length ? receipt.items.map(item => (
              <tr key={item.id} style={{borderTop:"1px solid #E7E9E2"}}><td style={{padding:"10px 12px"}}><strong>{item.productName}</strong>{(item.size||item.weight)&&<small style={styles.itemMeta}>{item.size||String(item.weight)+" kg"}</small>}</td><td style={{padding:"10px 12px",textAlign:"center"}}>{item.quantity}</td><td style={{padding:"10px 12px",textAlign:"right"}}>{money(item.unitPrice)}</td><td style={{padding:"10px 12px",textAlign:"right",fontWeight:800}}>{money(item.lineTotal)}</td></tr>
            )) : <tr><td colSpan={4} style={{textAlign:"center"}}>No product lines recorded.</td></tr>}
          </tbody>
          <tfoot><tr style={{background:"#F8F2E5",fontWeight:900,borderTop:"1px solid #D8DED5"}}><td style={{padding:"12px"}} colSpan={2}>Total quantity: {receipt.totalQuantity}</td><td style={{padding:"12px"}}>Order total</td><td style={{padding:"12px",textAlign:"right",color:"#E85F18",fontSize:17}}>{money(receipt.totalAmount)}</td></tr></tfoot>
        </table>
      </div>
    </div>
  );
}

interface Props { token: string; userRole: "admin" | "agent"; }
export default function NotificationPage({token,userRole}:Props) {
  const {
    notifications, unreadCount, loading, error, filters, setFilters,
    markAsRead, markAllAsRead, deleteNotification, refresh,
  } = useAgentNotifications(token);
  const [selected,setSelected] = useState<string|null>(null);
  const [autoExpanded, setAutoExpanded] = useState(false);
  const [search,setSearch] = useState("");

  const filtered = useMemo(() => notifications.filter((notification) => {
    const receipt = notification.data?.receipt;
    const products = (receipt?.items||[]).map((item:ReceiptItem)=>item.productName).join(" ");
    const target = [notification.title,notification.message,notification.orderId||"",receipt?.customer?.name||"",receipt?.customer?.phone||"",products].join(" ").toLowerCase();
    return !search.trim() || target.includes(search.trim().toLowerCase());
  }),[notifications,search]);

  useEffect(() => {
    if (loading || autoExpanded || notifications.length === 0) return;
    const firstOrderNotification = notifications.find((item) => !!item.orderId);
    if (firstOrderNotification) setSelected(firstOrderNotification.id);
    if (firstOrderNotification) setAutoExpanded(true);
  }, [notifications, loading, autoExpanded]);

  const unread = notifications.filter(n=>!n.isRead).length;
  const read = notifications.length - unread;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div><h1 style={styles.title}>🔔 {userRole==="admin"?"Admin Notifications":"Station Notifications"}</h1><p style={styles.subtitle}>{unread?unread+" unread notifications":"You are all caught up"}</p></div>
        <div style={styles.headerActions}><button style={styles.ghostButton} onClick={()=>void refresh()}>↻ Refresh</button>{unread>0&&<button style={styles.orangeButton} onClick={()=>void markAllAsRead()}>Mark all read</button>}</div>
      </header>
      <div style={styles.filters}>
        <div style={styles.tabs}>
          {(["all","unread","read"] as const).map(tab=><button key={tab} onClick={()=>setFilters({...filters,status:tab})} style={{...styles.tab,...(filters.status===tab?styles.activeTab:{})}}>{tab==="all"?"All":tab==="unread"?"Unread ("+unread+")":"Read ("+read+")"}</button>)}
        </div>
        <div style={styles.filterRight}>
          <select style={styles.select} value={filters.type} onChange={e=>setFilters({...filters,type:e.target.value})}>
            <option value="all">All types</option><option value="order_placed">New orders</option><option value="driver_assigned">Driver assigned</option><option value="picked_up">Picked up</option><option value="in_transit">In transit</option><option value="nearby">Driver arrived</option><option value="delivered">Delivered</option><option value="system_announcement">Stock / system</option>
          </select>
          <select style={styles.select} value={filters.dateRange} onChange={e=>setFilters({...filters,dateRange:e.target.value as any})}>
            <option value="all">All time</option><option value="today">Today</option><option value="week">This week</option><option value="month">This month</option>
          </select>
          <input style={styles.search} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notifications, customers or products…"/>
        </div>
      </div>
      {error&&<div style={styles.error}>{error}<button style={styles.retry} onClick={()=>void refresh()}>Retry</button></div>}
      {loading&&notifications.length===0&&<div style={styles.empty}>Loading notifications…</div>}
      {!loading&&filtered.length===0&&<div style={styles.empty}>No notifications match this view.</div>}
      <div style={styles.list}>
        {filtered.map(notification=>{
          const expanded=selected===notification.id;
          return (
            <article key={notification.id} style={{...styles.card,...(!notification.isRead?styles.unreadCard:{})}}>
              <div style={{...styles.indicator,background:notification.type==="delivered"?"#168447":notification.type==="cancelled"?"#D92D20":"#F36A21"}}/>
              <div style={styles.cardBody}>
                <button style={styles.cardToggle} onClick={()=>{if(!notification.isRead)void markAsRead(notification.id);setSelected(expanded?null:notification.id);}} aria-expanded={expanded}>
                  <div style={styles.cardTitleRow}><strong style={styles.cardTitle}>{!notification.isRead&&<span style={styles.dot}/>} {notification.title}</strong><span style={styles.timestamp}>{dateTime(notification.createdAt)}</span></div>
                  <span style={styles.message}>{notification.message}</span>
                </button>
                {expanded&&<div style={styles.expanded}>
                  {notification.orderId?<ReceiptPanel receipt={notification.data?.receipt} notification={notification}/>:<div style={styles.fallback}>
                    {notification.data?.scope&&<Detail label="Scope" value={notification.data.scope}/>}
                    {notification.data?.stationName&&<Detail label="Station" value={notification.data.stationName}/>}
                    {notification.data?.productName&&<Detail label="Product" value={notification.data.productName}/>}
                    {notification.data?.addedQuantity!=null&&<Detail label="Quantity added" value={String(notification.data.addedQuantity)}/>}
                    {notification.data?.availableStock!=null&&<Detail label="New stock" value={String(notification.data.availableStock)}/>}
                  </div>}
                </div>}
              </div>
              <div style={styles.actions}>{!notification.isRead&&<button style={styles.actionButton} onClick={()=>void markAsRead(notification.id)}>✓</button>}<button style={styles.deleteButton} onClick={()=>void deleteNotification(notification.id)}>×</button></div>
            </article>
          );
        })}
      </div>
      <footer style={styles.footer}>Showing {filtered.length} notifications · {unread} unread · {read} read</footer>
    </div>
  );
}
const styles:Record<string,React.CSSProperties> = {
  container:{margin:"-24px",padding:"28px 30px 36px",minHeight:"calc(100vh - 64px)",background:GREEN_BACKGROUND,color:"#FFF8EE",fontFamily:"Inter,system-ui,-apple-system,Segoe UI,sans-serif"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,marginBottom:20,flexWrap:"wrap"},title:{margin:0,fontSize:29,fontWeight:850,color:"#FFF8EE"},subtitle:{margin:"5px 0 0",color:"#C6E5D4",fontSize:13},
  headerActions:{display:"flex",gap:9},ghostButton:{padding:"9px 13px",borderRadius:9,border:"1px solid rgba(255,248,238,.35)",background:"rgba(255,248,238,.10)",color:"#FFF8EE",fontWeight:700,cursor:"pointer"},orangeButton:{padding:"10px 15px",border:0,borderRadius:9,background:"#F36A21",color:"#fff",fontWeight:800,cursor:"pointer"},
  filters:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",padding:10,marginBottom:18,borderRadius:14,background:"#FFF8EE",boxShadow:"0 8px 28px rgba(0,0,0,.16)"},tabs:{display:"flex",gap:4,padding:4,borderRadius:9,background:"#E7E9E8"},tab:{padding:"9px 15px",border:0,borderRadius:7,background:"transparent",color:"#475569",fontWeight:700,cursor:"pointer"},activeTab:{background:"#087C43",color:"#fff"},
  filterRight:{display:"flex",flex:"1 1 440px",justifyContent:"flex-end",gap:8,flexWrap:"wrap"},select:{padding:"9px 11px",borderRadius:9,border:"1px solid #CBD5D1",background:"#fff",color:"#10251A"},search:{flex:"1 1 220px",maxWidth:340,padding:"10px 13px",borderRadius:9,border:"1px solid #CBD5D1",background:"#fff",color:"#10251A",outline:"none"},
  error:{padding:12,marginBottom:14,borderRadius:9,background:"#FEE2E2",color:"#7F1D1D"},retry:{marginLeft:12,padding:"5px 10px",border:0,borderRadius:6,cursor:"pointer"},empty:{padding:36,textAlign:"center",borderRadius:12,background:"rgba(0,0,0,.16)",color:"#E0F0E7"},
  list:{display:"flex",flexDirection:"column",gap:12},card:{display:"flex",alignItems:"stretch",gap:13,padding:16,borderRadius:14,background:"#FFF8EE",border:"1px solid rgba(255,255,255,.8)",boxShadow:"0 8px 26px rgba(0,0,0,.16)"},unreadCard:{borderColor:"#F36A21",boxShadow:"0 0 0 1px rgba(243,106,33,.20),0 8px 26px rgba(0,0,0,.16)"},indicator:{width:5,borderRadius:6,flexShrink:0},cardBody:{flex:1,minWidth:0},cardToggle:{width:"100%",padding:0,border:0,background:"transparent",textAlign:"left",cursor:"pointer",color:"#10251A"},cardTitleRow:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap",marginBottom:5},cardTitle:{display:"flex",alignItems:"center",gap:7,color:"#0B281A",fontSize:16,fontWeight:800},dot:{width:8,height:8,borderRadius:"50%",background:"#F36A21",display:"inline-block"},timestamp:{color:"#758278",fontSize:12,whiteSpace:"nowrap"},message:{display:"block",color:"#43534A",fontSize:14,lineHeight:1.5},expanded:{marginTop:14,paddingTop:13,borderTop:"1px solid #E4E8E4"},
  receipt:{padding:14,border:"1px solid #D8E0D8",borderRadius:13,background:"#FFFCF6",color:"#10251A"},receiptHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:12},eyebrow:{fontSize:10,fontWeight:900,letterSpacing:1.1,color:"#68786F"},orderNumber:{fontSize:19,fontWeight:900,color:"#0B3D2E",margin:"2px 0 0"},status:{padding:"6px 12px",borderRadius:99,background:"#087C43",color:"#fff",fontSize:11,fontWeight:900},infoGrid:{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12,marginBottom:12},infoColumn:{padding:"9px 12px",border:"1px solid #E3E8E2",borderRadius:10},detail:{display:"flex",justifyContent:"space-between",gap:8,padding:"5px 0",fontSize:12,color:"#21382A"},tableWrap:{overflowX:"auto",border:"1px solid #DADFD8",borderRadius:10},table:{width:"100%",minWidth:570,borderCollapse:"collapse",fontSize:12,color:"#10251A"},itemMeta:{display:"block",fontSize:10,color:"#738077"},fallback:{padding:13,borderRadius:10,border:"1px solid #D8E0D8",background:"#FFFCF6",color:"#193326"},actions:{display:"flex",flexDirection:"column",gap:6},actionButton:{width:30,height:30,border:"1px solid #D8E0D8",borderRadius:7,background:"#fff",color:"#087C43",fontWeight:900,cursor:"pointer"},deleteButton:{width:30,height:30,border:"1px solid #F3D2C8",borderRadius:7,background:"#FFF1EC",color:"#B54723",fontSize:20,cursor:"pointer"},footer:{padding:"14px 0 4px",color:"#C6E5D4",fontSize:12}
};
