export default function LotoBall({ number }) {
  return (
    <div style={{
      width:120,height:120,borderRadius:'50%',
      background:'red',color:'white',
      display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:48
    }}>
      {number}
    </div>
  );
}
