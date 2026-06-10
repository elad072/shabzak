import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface Person {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  default_role_id: string | null;
  default_role?: string;
  is_standard: boolean;
  rank: string | null;
}

interface Role {
  id: string;
  role_name: string;
  rank: string | null;
  teken: string | null;
  teken_quantity: number | null;
}

export const exportPeopleToExcel = async (people: Person[], roles: Role[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('רשימת כוח אדם');

  // Set RTL
  worksheet.views = [{ rightToLeft: true }];


  // --- Available Slots Summary (Top) ---
  const availableSlotsHeader = worksheet.addRow(['תקנים פנויים לפי תפקיד']);
  availableSlotsHeader.font = { bold: true, size: 16, color: { argb: 'FF1E293B' } };
  worksheet.mergeCells(`A${availableSlotsHeader.number}:D${availableSlotsHeader.number}`);
  availableSlotsHeader.alignment = { horizontal: 'center' };
  
  const slotsSubHeader = worksheet.addRow(['תפקיד', 'תקן נדרש', 'מאויש', 'פנוי']);
  slotsSubHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  slotsSubHeader.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  roles.forEach(role => {
    const occupied = people.filter(p => p.default_role_id === role.id && p.is_standard).length;
    const required = role.teken_quantity || 0;
    const available = Math.max(0, required - occupied);

    if (available > 0) {
      const row = worksheet.addRow([role.role_name, required, occupied, available]);
      row.alignment = { horizontal: 'center' };
      row.getCell(4).font = { bold: true, color: { argb: 'FF059669' } };
      row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
    }
  });

  worksheet.addRow([]); // Spacer
  worksheet.addRow([]); // Spacer

  // --- Main Personnel Table ---
  const mainTableHeader = worksheet.addRow(['רשימת כוח אדם מפורטת']);
  mainTableHeader.font = { bold: true, size: 14 };
  worksheet.mergeCells(`A${mainTableHeader.number}:F${mainTableHeader.number}`);

  const headerRow = worksheet.addRow(['דרגה', 'שם פרטי', 'שם משפחה', 'תפקיד', 'טלפון', 'סטטוס תקן']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Set column widths (manually since we have multiple tables)
  worksheet.getColumn(1).width = 12;
  worksheet.getColumn(2).width = 18;
  worksheet.getColumn(3).width = 18;
  worksheet.getColumn(4).width = 25;
  worksheet.getColumn(5).width = 20;
  worksheet.getColumn(6).width = 15;

  // Add data
  people.forEach((person) => {
    const role = roles.find((r) => r.id === person.default_role_id);
    const row = worksheet.addRow([
      person.rank || '',
      person.first_name,
      person.last_name,
      role ? role.role_name : person.default_role || '',
      person.phone || '',
      person.is_standard ? 'בתקן' : 'מחוץ לתקן',
    ]);

    // Conditional formatting for standard
    if (!person.is_standard) {
      row.getCell(6).font = { color: { argb: 'FFFF0000' } };
    }
    
    row.alignment = { horizontal: 'right', vertical: 'middle' };
  });

  // Add General Summary Section
  worksheet.addRow([]);
  const generalSummaryHeader = worksheet.addRow(['סיכום כללי']);
  generalSummaryHeader.font = { bold: true, size: 14 };
  
  const totalPeople = people.length;
  const standardPeople = people.filter(p => p.is_standard).length;
  const nonStandardPeople = people.filter(p => !p.is_standard).length;
  
  const griaPeople = people.filter(p => {
    const role = roles.find(r => r.id === p.default_role_id);
    return role?.role_name === 'גריעה';
  }).length;

  const undefinedTekenPeople = people.filter(p => {
    const role = roles.find(r => r.id === p.default_role_id);
    return !role?.teken || role.teken === 'לא הוגדר';
  }).length;

  worksheet.addRow(['סה"כ צוות', totalPeople]);
  worksheet.addRow(['כמה בתקן', standardPeople]);
  worksheet.addRow(['כמה על תקני', nonStandardPeople]);
  worksheet.addRow(['גריעה', griaPeople]);
  worksheet.addRow(['תקן לא הוגדר', undefinedTekenPeople]);
  
  worksheet.addRow([]);

  // Add Role Summary Section
  const summaryHeaderRow = worksheet.addRow(['סיכום תקנים לפי תפקיד']);
  summaryHeaderRow.font = { bold: true, size: 14 };
  
  worksheet.addRow(['תפקיד', 'מאויש בתקן', 'תקן נדרש', 'סטטוס']);
  const subHeaderRow = worksheet.lastRow!;
  subHeaderRow.font = { bold: true };
  subHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9D9D9' },
  };

  roles.forEach((role) => {
    const occupied = people.filter(
      (p) => p.default_role_id === role.id && p.is_standard
    ).length;
    const required = role.teken_quantity || 0;
    const diff = occupied - required;
    
    let status = 'תקין';
    if (diff < 0) status = `חסר ${Math.abs(diff)}`;
    if (diff > 0) status = `חריגה ${diff}`;

    const row = worksheet.addRow([
      role.role_name,
      occupied,
      required,
      status
    ]);

    if (diff < 0) {
      row.getCell(4).font = { color: { argb: 'FFFF0000' }, bold: true };
    } else if (diff > 0) {
      row.getCell(4).font = { color: { argb: 'FF0070C0' }, bold: true };
    }
  });

  // Add Available Slots Section (The "Beautiful" part)
  worksheet.addRow([]);
  const availableHeaderRow = worksheet.addRow(['תקנים פנויים (דרושים)']);
  availableHeaderRow.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  availableHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF10B981' }, // Emerald-500
  };
  availableHeaderRow.alignment = { horizontal: 'center' };
  worksheet.mergeCells(`A${availableHeaderRow.number}:D${availableHeaderRow.number}`);

  const availableSubHeader = worksheet.addRow(['תפקיד', 'תקן כולל', 'מאויש בפועל', 'נותר לאיוש']);
  availableSubHeader.font = { bold: true, color: { argb: 'FF1F2937' } };
  availableSubHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECFDF5' }, // Emerald-50
  };
  availableSubHeader.alignment = { horizontal: 'center' };

  roles.forEach((role) => {
    const occupied = people.filter(
      (p) => p.default_role_id === role.id && p.is_standard
    ).length;
    const required = role.teken_quantity || 0;
    const available = Math.max(0, required - occupied);

    if (available > 0) {
      const row = worksheet.addRow([
        role.role_name,
        required,
        occupied,
        available
      ]);
      row.alignment = { horizontal: 'center' };
      row.getCell(4).font = { bold: true, color: { argb: 'FF059669' } }; // Emerald-600
      row.getCell(4).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD1FAE5' }, // Emerald-100
      };
    }
  });

  // Borders and general styling for all cells
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
      if (!cell.alignment) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });
  });

  // Generate and save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Personnel_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
};
