# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey has `on_delete` set to the desired behavior.
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models

from .models_orchard import *  # noqa F401
from .models_services import *  # noqa F401


class LegacyCrExport(models.Model):
    ph_name = models.CharField(
        db_column="PH_Name", max_length=51, blank=True, null=True
    )  # Field name made lowercase.
    ph_2 = models.CharField(
        db_column="PH_2", max_length=6, blank=True, null=True
    )  # Field name made lowercase.
    ph_dateprinted = models.CharField(
        db_column="PH_DatePrinted", max_length=13, blank=True, null=True
    )  # Field name made lowercase.
    ph_address = models.CharField(
        db_column="PH_Address", max_length=75, blank=True, null=True
    )  # Field name made lowercase.
    ph_5 = models.CharField(
        db_column="PH_5", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    ph_clientno = models.IntegerField(
        db_column="PH_ClientNo", blank=True, null=True
    )  # Field name made lowercase.
    ph_address2 = models.CharField(
        db_column="PH_Address2", max_length=63, blank=True, null=True
    )  # Field name made lowercase.
    ph_accountto = models.CharField(
        db_column="PH_AccountTo", max_length=143, blank=True, null=True
    )  # Field name made lowercase.
    ph_9 = models.CharField(
        db_column="PH_9", max_length=11, blank=True, null=True
    )  # Field name made lowercase.
    ph_invoiceno = models.IntegerField(
        db_column="PH_InvoiceNo", blank=True, null=True
    )  # Field name made lowercase.
    ph_11 = models.CharField(
        db_column="PH_11", max_length=4, blank=True, null=True
    )  # Field name made lowercase.
    ph_12 = models.CharField(
        db_column="PH_12", max_length=6, blank=True, null=True
    )  # Field name made lowercase.
    ph_13 = models.CharField(
        db_column="PH_13", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    ph_14 = models.CharField(
        db_column="PH_14", max_length=8, blank=True, null=True
    )  # Field name made lowercase.
    ph_15 = models.CharField(
        db_column="PH_15", max_length=9, blank=True, null=True
    )  # Field name made lowercase.
    ph_16 = models.CharField(
        db_column="PH_16", max_length=13, blank=True, null=True
    )  # Field name made lowercase.
    ph_17 = models.CharField(
        db_column="PH_17", max_length=11, blank=True, null=True
    )  # Field name made lowercase.
    ph_18 = models.CharField(
        db_column="PH_18", max_length=12, blank=True, null=True
    )  # Field name made lowercase.
    ph_19 = models.CharField(
        db_column="PH_19", max_length=9, blank=True, null=True
    )  # Field name made lowercase.
    ph_20 = models.CharField(
        db_column="PH_20", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    ph_21 = models.CharField(
        db_column="PH_21", max_length=13, blank=True, null=True
    )  # Field name made lowercase.
    ph_22 = models.CharField(
        db_column="PH_22", max_length=6, blank=True, null=True
    )  # Field name made lowercase.
    ph_23 = models.CharField(
        db_column="PH_23", max_length=7, blank=True, null=True
    )  # Field name made lowercase.
    ph_24 = models.CharField(
        db_column="PH_24", max_length=5, blank=True, null=True
    )  # Field name made lowercase.
    ph_25 = models.CharField(
        db_column="PH_25", max_length=12, blank=True, null=True
    )  # Field name made lowercase.
    de_datereqd = models.CharField(
        db_column="DE_DateReqd", max_length=9, blank=True, null=True
    )  # Field name made lowercase.
    de_jobnumber = models.IntegerField(
        db_column="DE_JobNumber", blank=True, null=True
    )  # Field name made lowercase.
    de_refno = models.CharField(
        db_column="DE_RefNo", max_length=16, blank=True, null=True
    )  # Field name made lowercase.
    de_cartype = models.CharField(
        db_column="DE_CarType", max_length=11, blank=True, null=True
    )  # Field name made lowercase.
    de_pickupname = models.CharField(
        db_column="DE_PickupName", max_length=101, blank=True, null=True
    )  # Field name made lowercase.
    de_pickup = models.CharField(
        db_column="DE_Pickup", max_length=51, blank=True, null=True
    )  # Field name made lowercase.
    de_destination = models.CharField(
        db_column="DE_Destination", max_length=51, blank=True, null=True
    )  # Field name made lowercase.
    de_bookingtime = models.CharField(
        db_column="DE_BookingTime", max_length=7, blank=True, null=True
    )  # Field name made lowercase.
    de_droptime = models.CharField(
        db_column="DE_DropTime", max_length=7, blank=True, null=True
    )  # Field name made lowercase.
    de_totaltime = models.CharField(
        db_column="DE_TotalTime", max_length=7, blank=True, null=True
    )  # Field name made lowercase.
    de_tripcharge = models.FloatField(
        db_column="DE_TripCharge", blank=True, null=True
    )  # Field name made lowercase.
    de_authwaitingcharge = models.FloatField(
        db_column="DE_AuthWaitingCharge", blank=True, null=True
    )  # Field name made lowercase.
    de_extras = models.FloatField(
        db_column="DE_Extras", blank=True, null=True
    )  # Field name made lowercase.
    de_cardriverequip = models.FloatField(
        db_column="DE_CarDriverEquip", blank=True, null=True
    )  # Field name made lowercase.
    de_totaltripcharge = models.FloatField(
        db_column="DE_TotalTripCharge", blank=True, null=True
    )  # Field name made lowercase.
    gf1_1 = models.CharField(
        db_column="GF1_1", max_length=40, blank=True, null=True
    )  # Field name made lowercase.
    gf1_2 = models.CharField(
        db_column="GF1_2", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    gf1_rtotal0 = models.FloatField(
        db_column="GF1_RTotal0", blank=True, null=True
    )  # Field name made lowercase.
    pf_pagenofm = models.CharField(
        db_column="PF_PageNofM", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "CREXPORT"


class LegacySCCDAccountTypes(models.Model):
    type = models.CharField(
        db_column="Type", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "SCCD_AccountTypes"


class LegacySCCDCapacity(models.Model):
    emp_capacity = models.CharField(
        db_column="EmpCapacity", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    capacity_code = models.CharField(
        db_column="CapacityCode", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "SCCD_Capacity"


class LegacySysDiagrams(models.Model):
    name = models.CharField(max_length=128)
    principal_id = models.IntegerField()
    diagram_id = models.AutoField(primary_key=True)
    version = models.IntegerField(blank=True, null=True)
    definition = models.BinaryField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "sysdiagrams"
        unique_together = (("principal_id", "name"),)


class LegacyAccountTypes(models.Model):
    type = models.CharField(
        db_column="Type", primary_key=True, max_length=20
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblAccountTypes"


class LegacyAdhocInvoices(models.Model):
    jobnumber = models.IntegerField(db_column="JobNumber")  # Field name made lowercase.
    date_required = models.CharField(
        db_column="DateRequired", max_length=8
    )  # Field name made lowercase.
    time_required = models.CharField(
        db_column="TimeRequired", max_length=4
    )  # Field name made lowercase.
    total_trip_charge = models.DecimalField(
        db_column="TotalTripCharge", max_digits=10, decimal_places=4
    )  # Field name made lowercase.
    dest_suburb = models.CharField(
        db_column="DestSuburb", max_length=25
    )  # Field name made lowercase.
    dest_postcode = models.IntegerField(
        db_column="DestPostcode"
    )  # Field name made lowercase.
    dest_address = models.CharField(
        db_column="DestAddress", max_length=50
    )  # Field name made lowercase.
    dest_no = models.IntegerField(db_column="DestNo")  # Field name made lowercase.
    pu_name = models.CharField(
        db_column="PUName", max_length=100
    )  # Field name made lowercase.
    pu_suburb = models.CharField(
        db_column="PUSuburb", max_length=25
    )  # Field name made lowercase.
    pu_postcode = models.IntegerField(
        db_column="PUPostcode"
    )  # Field name made lowercase.
    pu_address = models.CharField(
        db_column="PUAddress", max_length=50
    )  # Field name made lowercase.
    pu_no = models.IntegerField(db_column="PUNo")  # Field name made lowercase.
    credit_card_surcharge = models.DecimalField(
        db_column="CreditCardSurcharge",
        max_digits=10,
        decimal_places=4,
        blank=True,
        null=True,
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblAdhocInvoices"


class LegacyAssignCPartyCar(models.Model):
    carno = models.CharField(
        db_column="CarNo", primary_key=True, max_length=6
    )  # Field name made lowercase.
    cpid = models.IntegerField(db_column="CPID")  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblAssignCPartyCar"
        unique_together = (("carno", "cpid"),)


class LegacyAssignments(models.Model):
    driver_no = models.OneToOneField(
        "LegacyDriver", models.DO_NOTHING, db_column="DriverNo", primary_key=True
    )  # Field name made lowercase.
    car_no = models.ForeignKey(
        "LegacyCar", models.DO_NOTHING, db_column="CarNo"
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblAssignments"
        unique_together = (("driver_no", "car_no"),)


class LegacyBookingDetailsReport(models.Model):
    job_number = models.IntegerField(
        db_column="JobNumber", primary_key=True
    )  # Field name made lowercase.
    date_required = models.CharField(
        db_column="DateRequired", max_length=8
    )  # Field name made lowercase.
    time_required = models.CharField(
        db_column="TimeRequired", max_length=4
    )  # Field name made lowercase.
    car_type = models.CharField(
        db_column="CarType", max_length=10
    )  # Field name made lowercase.
    payment_method = models.CharField(
        db_column="PaymentMethod", max_length=20
    )  # Field name made lowercase.
    customer_price = models.DecimalField(
        db_column="CustomerPrice", max_digits=10, decimal_places=4
    )  # Field name made lowercase.
    instructions = models.TextField(
        db_column="Instructions"
    )  # Field name made lowercase. This field type is a guess.

    class Meta:
        managed = False
        db_table = "tblBookingDetailsReport"


class LegacyBookingLog(models.Model):
    log_number = models.IntegerField(
        db_column="LogNumber", primary_key=True
    )  # Field name made lowercase.
    job_number = models.ForeignKey(
        "LegacyBookings", models.DO_NOTHING, db_column="JobNumber"
    )  # Field name made lowercase.
    datetime = models.DateTimeField(db_column="DateTime")  # Field name made lowercase.
    operator_id = models.CharField(
        db_column="OperatorId", max_length=20
    )  # Field name made lowercase.
    log_note = models.CharField(
        db_column="LogNote", max_length=500, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblBookingLog"


class LegacyBookingRequirements(models.Model):
    bookingreqid = models.IntegerField(
        db_column="BookingReqID", primary_key=True
    )  # Field name made lowercase.
    requirement = models.CharField(
        db_column="Requirement", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    requirementno = models.IntegerField(
        db_column="RequirementNo", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblBookingRequirements"


class LegacyBookingType(models.Model):
    bookingtypeid = models.CharField(
        db_column="BookingTypeID", primary_key=True, max_length=1
    )  # Field name made lowercase.
    bookingtype = models.CharField(
        db_column="BookingType", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    isvalet = models.BooleanField(
        db_column="IsValet", blank=True, null=True
    )  # Field name made lowercase.
    orderid = models.IntegerField(
        db_column="OrderID", blank=True, null=True
    )  # Field name made lowercase.
    isactive = models.BooleanField(db_column="IsActive")  # Field name made lowercase.
    isdefault = models.BooleanField(db_column="IsDefault")  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblBookingType"


class LegacyBookings(models.Model):
    jobnumber = models.AutoField(
        db_column="JobNumber", primary_key=True
    )  # Field name made lowercase.
    clientno = models.ForeignKey(
        "LegacyClient", models.DO_NOTHING, db_column="ClientNo", related_name="bookings"
    )  # Field name made lowercase.
    sxdatebooked = models.DateTimeField(
        db_column="SXDateBooked"
    )  # Field name made lowercase.
    daterequired = models.CharField(
        db_column="DateRequired", max_length=8
    )  # Field name made lowercase.
    timerequired = models.CharField(
        db_column="TimeRequired", max_length=4
    )  # Field name made lowercase.
    cartype = models.CharField(
        db_column="CarType", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    acctno = models.CharField(
        db_column="Acctno", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    contactname = models.CharField(
        db_column="ContactName", max_length=25, blank=True, null=True
    )  # Field name made lowercase.
    contactphone = models.CharField(
        db_column="ContactPhone", max_length=40, blank=True, null=True
    )  # Field name made lowercase.
    pricingmethod = models.CharField(
        db_column="PricingMethod", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    instructions = models.TextField(
        db_column="Instructions", blank=True, null=True
    )  # Field name made lowercase. This field type is a guess.
    bookingtype = models.CharField(
        db_column="BookingType", max_length=1
    )  # Field name made lowercase.
    carno = models.CharField(
        db_column="CarNo", max_length=6, blank=True, null=True
    )  # Field name made lowercase.
    driverno = models.IntegerField(db_column="DriverNo")  # Field name made lowercase.
    status = models.CharField(
        db_column="Status", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    sxoperator = models.CharField(
        db_column="SXOperator", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    carposn = models.IntegerField(db_column="CarPosn")  # Field name made lowercase.
    carcount = models.IntegerField(db_column="CarCount")  # Field name made lowercase.
    tripcharge = models.DecimalField(
        db_column="TripCharge", max_digits=10, decimal_places=4
    )  # Field name made lowercase.
    authwaitingcharge = models.DecimalField(
        db_column="AuthWaitingCharge", max_digits=10, decimal_places=4
    )  # Field name made lowercase.
    extras = models.DecimalField(
        db_column="Extras", max_digits=10, decimal_places=4
    )  # Field name made lowercase.
    totaltripcharge = models.DecimalField(
        db_column="TotalTripCharge", max_digits=10, decimal_places=4
    )  # Field name made lowercase.
    cardriverequip = models.DecimalField(
        db_column="CarDriverEquip", max_digits=10, decimal_places=4
    )  # Field name made lowercase.
    driverjobvalue = models.DecimalField(
        db_column="DriverJobValue", max_digits=10, decimal_places=4
    )  # Field name made lowercase.
    pickuptime = models.CharField(
        db_column="PickupTime", max_length=4, blank=True, null=True
    )  # Field name made lowercase.
    droptime = models.CharField(
        db_column="DropTime", max_length=4, blank=True, null=True
    )  # Field name made lowercase.
    totaltime = models.CharField(
        db_column="TotalTime", max_length=4, blank=True, null=True
    )  # Field name made lowercase.
    kilometers = models.CharField(
        db_column="Kilometers", max_length=4, blank=True, null=True
    )  # Field name made lowercase.
    referenceno = models.CharField(
        db_column="ReferenceNo", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    paymentmethod = models.CharField(
        db_column="PaymentMethod", max_length=20
    )  # Field name made lowercase.
    deleted = models.CharField(
        db_column="Deleted", max_length=1, blank=True, null=True
    )  # Field name made lowercase.
    variation = models.CharField(
        db_column="Variation", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    despatchdisplayorder = models.CharField(
        db_column="DespatchDisplayOrder", max_length=1
    )  # Field name made lowercase.
    rateschedule = models.CharField(
        db_column="RateSchedule", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    noofpax = models.IntegerField(
        db_column="NoOfPax", blank=True, null=True
    )  # Field name made lowercase.
    runno = models.IntegerField(
        db_column="RunNo", blank=True, null=True
    )  # Field name made lowercase.
    bookingreq01 = models.CharField(
        db_column="BookingReq01", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    bookingreq02 = models.CharField(
        db_column="BookingReq02", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    bookingreq03 = models.CharField(
        db_column="BookingReq03", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    bookingreq04 = models.CharField(
        db_column="BookingReq04", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    bookingreq05 = models.CharField(
        db_column="BookingReq05", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    bookingreqisvalet = models.BooleanField(
        db_column="BookingReqISValet", blank=True, null=True
    )  # Field name made lowercase.
    collected = models.DecimalField(
        db_column="Collected", max_digits=10, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.
    contractedpartyid = models.IntegerField(
        db_column="ContractedPartyID", blank=True, null=True
    )  # Field name made lowercase.
    bookingcode = models.CharField(
        db_column="BookingCode", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    noofchildren = models.SmallIntegerField(
        db_column="NoOfChildren", blank=True, null=True
    )  # Field name made lowercase.
    nocheckinitems = models.SmallIntegerField(
        db_column="NoCheckInItems", blank=True, null=True
    )  # Field name made lowercase.
    isairport = models.BooleanField(
        db_column="IsAirport", blank=True, null=True
    )  # Field name made lowercase.
    afterhourssurcharge = models.DecimalField(
        db_column="AfterHoursSurcharge",
        max_digits=10,
        decimal_places=4,
        blank=True,
        null=True,
    )  # Field name made lowercase.
    equipmentfee = models.DecimalField(
        db_column="EquipmentFee", max_digits=10, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.
    bookingfee = models.DecimalField(
        db_column="BookingFee", max_digits=10, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.
    variationfee = models.DecimalField(
        db_column="VariationFee", max_digits=10, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.
    creditcardsurcharge = models.DecimalField(
        db_column="CreditCardSurcharge",
        max_digits=10,
        decimal_places=4,
        blank=True,
        null=True,
    )  # Field name made lowercase.
    totalcharge = models.DecimalField(
        db_column="TotalCharge", max_digits=10, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.
    supplierrebate = models.DecimalField(
        db_column="SupplierRebate",
        max_digits=10,
        decimal_places=4,
        blank=True,
        null=True,
    )  # Field name made lowercase.
    otherinstructions = models.CharField(
        db_column="OtherInstructions", max_length=250, blank=True, null=True
    )  # Field name made lowercase.
    driverpayment = models.CharField(
        db_column="DriverPayment", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    contactid = models.IntegerField(
        db_column="ContactId", blank=True, null=True
    )  # Field name made lowercase.
    supplierref = models.CharField(
        db_column="SupplierRef", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    bookingmethod = models.CharField(
        db_column="BookingMethod", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    driverdisplayno = models.IntegerField(
        db_column="DriverDisplayNo", blank=True, null=True
    )  # Field name made lowercase.
    calcdaterequired = models.CharField(
        db_column="CalcDateRequired", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    calctimerequired = models.CharField(
        db_column="CalcTimeRequired", max_length=16, blank=True, null=True
    )  # Field name made lowercase.
    calcdeleted = models.BooleanField(
        db_column="CalcDeleted", blank=True, null=True
    )  # Field name made lowercase.
    portalusercreated = models.CharField(
        db_column="PortalUserCreated", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    portaluserlastupdated = models.CharField(
        db_column="PortalUserLastUpdated", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    pickupflightdelay = models.IntegerField(
        db_column="PickupFlightDelay", blank=True, null=True
    )  # Field name made lowercase.
    discount = models.DecimalField(
        db_column="Discount", max_digits=10, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.
    calcdatebooked = models.CharField(
        db_column="CalcDateBooked", max_length=10, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblBookings"
        unique_together = (("jobnumber", "clientno"),)


class LegacyBookingsV(models.Model):
    jobnumber = models.IntegerField(
        db_column="JobNumber", primary_key=True
    )  # Field name made lowercase.
    clientno = models.IntegerField(db_column="ClientNo")  # Field name made lowercase.
    versionstamp = models.CharField(
        db_column="VersionStamp", max_length=14
    )  # Field name made lowercase.
    sxdatebooked = models.DateTimeField(
        db_column="SXDateBooked"
    )  # Field name made lowercase.
    daterequired = models.CharField(
        db_column="DateRequired", max_length=8
    )  # Field name made lowercase.
    timerequired = models.CharField(
        db_column="TimeRequired", max_length=4
    )  # Field name made lowercase.
    cartype = models.CharField(
        db_column="CarType", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    acctno = models.CharField(
        db_column="Acctno", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    contactname = models.CharField(
        db_column="ContactName", max_length=25, blank=True, null=True
    )  # Field name made lowercase.
    contactphone = models.CharField(
        db_column="ContactPhone", max_length=40, blank=True, null=True
    )  # Field name made lowercase.
    pricingmethod = models.CharField(
        db_column="PricingMethod", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    instructions = models.TextField(
        db_column="Instructions", blank=True, null=True
    )  # Field name made lowercase. This field type is a guess.
    bookingtype = models.CharField(
        db_column="BookingType", max_length=1
    )  # Field name made lowercase.
    carno = models.CharField(
        db_column="CarNo", max_length=6, blank=True, null=True
    )  # Field name made lowercase.
    driverno = models.IntegerField(db_column="DriverNo")  # Field name made lowercase.
    status = models.CharField(
        db_column="Status", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    sxoperator = models.CharField(
        db_column="SXOperator", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    carposn = models.IntegerField(db_column="CarPosn")  # Field name made lowercase.
    carcount = models.IntegerField(db_column="CarCount")  # Field name made lowercase.
    tripcharge = models.DecimalField(
        db_column="TripCharge", max_digits=10, decimal_places=4
    )  # Field name made lowercase.
    authwaitingcharge = models.DecimalField(
        db_column="AuthWaitingCharge", max_digits=10, decimal_places=4
    )  # Field name made lowercase.
    extras = models.DecimalField(
        db_column="Extras", max_digits=10, decimal_places=4
    )  # Field name made lowercase.
    totaltripcharge = models.DecimalField(
        db_column="TotalTripCharge", max_digits=10, decimal_places=4
    )  # Field name made lowercase.
    cardriverequip = models.DecimalField(
        db_column="CarDriverEquip", max_digits=10, decimal_places=4
    )  # Field name made lowercase.
    driverjobvalue = models.DecimalField(
        db_column="DriverJobValue", max_digits=10, decimal_places=4
    )  # Field name made lowercase.
    pickuptime = models.CharField(
        db_column="PickupTime", max_length=4, blank=True, null=True
    )  # Field name made lowercase.
    droptime = models.CharField(
        db_column="DropTime", max_length=4, blank=True, null=True
    )  # Field name made lowercase.
    totaltime = models.CharField(
        db_column="TotalTime", max_length=4, blank=True, null=True
    )  # Field name made lowercase.
    kilometers = models.CharField(
        db_column="Kilometers", max_length=4, blank=True, null=True
    )  # Field name made lowercase.
    referenceno = models.CharField(
        db_column="ReferenceNo", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    paymentmethod = models.CharField(
        db_column="PaymentMethod", max_length=20
    )  # Field name made lowercase.
    deleted = models.CharField(
        db_column="Deleted", max_length=1, blank=True, null=True
    )  # Field name made lowercase.
    variation = models.CharField(
        db_column="Variation", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    despatchdisplayorder = models.CharField(
        db_column="DespatchDisplayOrder", max_length=1
    )  # Field name made lowercase.
    rateschedule = models.CharField(
        db_column="RateSchedule", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    noofpax = models.IntegerField(
        db_column="NoOfPax", blank=True, null=True
    )  # Field name made lowercase.
    runno = models.IntegerField(
        db_column="RunNo", blank=True, null=True
    )  # Field name made lowercase.
    bookingreq01 = models.CharField(
        db_column="BookingReq01", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    bookingreq02 = models.CharField(
        db_column="BookingReq02", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    bookingreq03 = models.CharField(
        db_column="BookingReq03", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    bookingreq04 = models.CharField(
        db_column="BookingReq04", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    bookingreq05 = models.CharField(
        db_column="BookingReq05", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    bookingreqisvalet = models.BooleanField(
        db_column="BookingReqISValet", blank=True, null=True
    )  # Field name made lowercase.
    collected = models.DecimalField(
        db_column="Collected", max_digits=10, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.
    contractedpartyid = models.IntegerField(
        db_column="ContractedPartyID", blank=True, null=True
    )  # Field name made lowercase.
    bookingcode = models.CharField(
        db_column="BookingCode", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    noofchildren = models.SmallIntegerField(
        db_column="NoOfChildren", blank=True, null=True
    )  # Field name made lowercase.
    nocheckinitems = models.SmallIntegerField(
        db_column="NoCheckInItems", blank=True, null=True
    )  # Field name made lowercase.
    isairport = models.BooleanField(
        db_column="IsAirport", blank=True, null=True
    )  # Field name made lowercase.
    afterhourssurcharge = models.DecimalField(
        db_column="AfterHoursSurcharge",
        max_digits=10,
        decimal_places=4,
        blank=True,
        null=True,
    )  # Field name made lowercase.
    equipmentfee = models.DecimalField(
        db_column="EquipmentFee", max_digits=10, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.
    bookingfee = models.DecimalField(
        db_column="BookingFee", max_digits=10, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.
    variationfee = models.DecimalField(
        db_column="VariationFee", max_digits=10, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.
    creditcardsurcharge = models.DecimalField(
        db_column="CreditCardSurcharge",
        max_digits=10,
        decimal_places=4,
        blank=True,
        null=True,
    )  # Field name made lowercase.
    totalcharge = models.DecimalField(
        db_column="TotalCharge", max_digits=10, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.
    supplierrebate = models.DecimalField(
        db_column="SupplierRebate",
        max_digits=10,
        decimal_places=4,
        blank=True,
        null=True,
    )  # Field name made lowercase.
    otherinstructions = models.CharField(
        db_column="OtherInstructions", max_length=250, blank=True, null=True
    )  # Field name made lowercase.
    driverpayment = models.CharField(
        db_column="DriverPayment", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    contactid = models.IntegerField(
        db_column="ContactId", blank=True, null=True
    )  # Field name made lowercase.
    supplierref = models.CharField(
        db_column="SupplierRef", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    bookingmethod = models.CharField(
        db_column="BookingMethod", max_length=50, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblBookingsV"
        unique_together = (("jobnumber", "clientno", "versionstamp"),)


class LegacyCapacity(models.Model):
    empcapacity = models.CharField(
        db_column="EmpCapacity", max_length=30
    )  # Field name made lowercase.
    capacitycode = models.CharField(
        db_column="CapacityCode", primary_key=True, max_length=1
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblCapacity"


class LegacyCar(models.Model):
    carno = models.CharField(
        db_column="CarNo", primary_key=True, max_length=6
    )  # Field name made lowercase.
    mh = models.CharField(db_column="MH", max_length=6)  # Field name made lowercase.
    make = models.CharField(
        db_column="Make", max_length=25
    )  # Field name made lowercase.
    model = models.CharField(
        db_column="Model", max_length=25
    )  # Field name made lowercase.
    colour = models.CharField(
        db_column="Colour", max_length=12
    )  # Field name made lowercase.
    yearofmake = models.CharField(
        db_column="YearOfMake", max_length=7, blank=True, null=True
    )  # Field name made lowercase.
    cartype = models.ForeignKey(
        "LegacyCartypes", models.DO_NOTHING, db_column="CarType", blank=True, null=True
    )  # Field name made lowercase.
    driverno = models.IntegerField(
        db_column="DriverNo", blank=True, null=True
    )  # Field name made lowercase.
    active = models.IntegerField(
        db_column="Active", blank=True, null=True
    )  # Field name made lowercase.
    bhppass = models.CharField(
        db_column="BHPPass", max_length=1, blank=True, null=True
    )  # Field name made lowercase.
    odometer = models.CharField(
        db_column="Odometer", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    inspectiondate = models.DateTimeField(
        db_column="InspectionDate", blank=True, null=True
    )  # Field name made lowercase.
    radioserialno = models.CharField(
        db_column="RadioSerialNo", max_length=10, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblCar"


class LegacyCarColour(models.Model):
    carcolourid = models.AutoField(
        db_column="CarColourId", primary_key=True
    )  # Field name made lowercase.
    displayname = models.CharField(
        db_column="DisplayName", max_length=25
    )  # Field name made lowercase.
    abbreviation = models.CharField(
        db_column="Abbreviation", max_length=6
    )  # Field name made lowercase.
    orderid = models.IntegerField(db_column="OrderID")  # Field name made lowercase.
    isactive = models.BooleanField(db_column="IsActive")  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblCarColour"

    def __str__(self):
        return self.displayname


class LegacyCarMake(models.Model):
    makeid = models.AutoField(
        db_column="MakeId", primary_key=True
    )  # Field name made lowercase.
    displayname = models.CharField(
        db_column="DisplayName", max_length=25
    )  # Field name made lowercase.
    abbreviation = models.CharField(
        db_column="Abbreviation", max_length=3
    )  # Field name made lowercase.
    orderid = models.IntegerField(db_column="OrderID")  # Field name made lowercase.
    isactive = models.BooleanField(db_column="IsActive")  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblCarMake"


class LegacyCartypes(models.Model):
    type = models.CharField(
        db_column="Type", primary_key=True, max_length=10
    )  # Field name made lowercase.
    abbreviation = models.CharField(
        db_column="Abbreviation", max_length=3, blank=True, null=True
    )  # Field name made lowercase.
    orderid = models.IntegerField(
        db_column="OrderID", blank=True, null=True
    )  # Field name made lowercase.
    isactive = models.BooleanField(db_column="IsActive")  # Field name made lowercase.
    displayname = models.CharField(
        db_column="DisplayName", max_length=25
    )  # Field name made lowercase.
    highcapacity = models.BooleanField(
        db_column="HighCapacity", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblCarTypes"

    def __str__(self):
        return self.displayname


class LegacyCategory(models.Model):
    categoryname = models.CharField(
        db_column="CategoryName", primary_key=True, max_length=40
    )  # Field name made lowercase.
    categorycode = models.CharField(
        db_column="CategoryCode", max_length=1
    )  # Field name made lowercase.
    special = models.CharField(
        db_column="Special", max_length=4
    )  # Field name made lowercase.
    orderid = models.IntegerField(
        db_column="OrderID", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblCategory"


class LegacyChargetype(models.Model):
    chargetype = models.CharField(
        db_column="ChargeType", primary_key=True, max_length=1
    )  # Field name made lowercase.
    chargedesc = models.CharField(
        db_column="ChargeDesc", max_length=20
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblChargeType"


class LegacyClassification(models.Model):
    classificationid = models.IntegerField(
        db_column="ClassificationID", primary_key=True
    )  # Field name made lowercase.
    classification = models.CharField(
        db_column="Classification", max_length=30, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblClassification"


class LegacyClient(models.Model):
    clientno = models.AutoField(
        db_column="ClientNo", primary_key=True
    )  # Field name made lowercase.
    title = models.CharField(
        db_column="Title", max_length=5, blank=True, null=True
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=250, blank=True, null=True
    )  # Field name made lowercase.
    accountno = models.CharField(
        db_column="AccountNo", max_length=10
    )  # Field name made lowercase.
    refno = models.CharField(
        db_column="RefNo", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    category = models.CharField(
        db_column="Category", max_length=1, blank=True, null=True
    )  # Field name made lowercase.
    status = models.CharField(
        db_column="Status", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    phone = models.CharField(
        db_column="Phone", max_length=15
    )  # Field name made lowercase.
    addrtype = models.CharField(
        db_column="AddrType", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    addrsubno = models.CharField(
        db_column="AddrSubNo", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    addrnumber = models.CharField(
        db_column="AddrNumber", max_length=10
    )  # Field name made lowercase.
    addrstreet = models.CharField(
        db_column="AddrStreet", max_length=30
    )  # Field name made lowercase.
    addrstreettype = models.CharField(
        db_column="AddrStreetType", max_length=10
    )  # Field name made lowercase.
    addrsuburb = models.CharField(
        db_column="AddrSuburb", max_length=25
    )  # Field name made lowercase.
    addrstate = models.CharField(
        db_column="AddrState", max_length=10
    )  # Field name made lowercase.
    addrpostcode = models.IntegerField(
        db_column="AddrPostCode"
    )  # Field name made lowercase.
    paymentmethod = models.CharField(
        db_column="PaymentMethod", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    description = models.CharField(
        db_column="Description", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    surname = models.CharField(
        db_column="Surname", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    firstnames = models.CharField(
        db_column="FirstNames", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    priority = models.SmallIntegerField(
        db_column="Priority", blank=True, null=True
    )  # Field name made lowercase.
    country = models.CharField(
        db_column="Country", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    datecreated = models.DateTimeField(
        db_column="DateCreated", blank=True, null=True
    )  # Field name made lowercase.
    department = models.CharField(
        db_column="Department", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    active = models.CharField(
        db_column="Active", max_length=8, blank=True, null=True
    )  # Field name made lowercase.
    operatorid = models.CharField(
        db_column="OperatorId", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    organisation = models.CharField(
        db_column="Organisation", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    email = models.CharField(
        db_column="Email", max_length=320, blank=True, null=True
    )  # Field name made lowercase.
    garagepass = models.BooleanField(
        db_column="GaragePass", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblClient"

    def __str__(self):
        return f"{self.name.strip()} ({self.clientno})"


class LegacyComms(models.Model):
    communicationno = models.AutoField(
        db_column="CommunicationNo", primary_key=True
    )  # Field name made lowercase.
    clientno = models.ForeignKey(
        "LegacyClient", models.DO_NOTHING, db_column="ClientNo", blank=True, null=True
    )  # Field name made lowercase.
    contactno = models.IntegerField(
        db_column="ContactNo", blank=True, null=True
    )  # Field name made lowercase.
    sentto = models.CharField(
        db_column="SentTo", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    type = models.CharField(
        db_column="Type", max_length=4, blank=True, null=True
    )  # Field name made lowercase.
    operatorid = models.CharField(
        db_column="OperatorId", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    date = models.DateTimeField(
        db_column="Date", blank=True, null=True
    )  # Field name made lowercase.
    message = models.TextField(
        db_column="Message", blank=True, null=True
    )  # Field name made lowercase. This field type is a guess.
    attachement = models.CharField(
        db_column="Attachement", max_length=500, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblComms"


class LegacyContact(models.Model):
    contactno = models.AutoField(
        db_column="ContactNo", primary_key=True
    )  # Field name made lowercase.
    clientno = models.ForeignKey(
        "LegacyClient", models.DO_NOTHING, db_column="ClientNo", related_name="contacts"
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=60
    )  # Field name made lowercase.
    posn = models.CharField(
        db_column="Posn", max_length=25, blank=True, null=True
    )  # Field name made lowercase.
    dept = models.CharField(
        db_column="Dept", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    busphone = models.CharField(
        db_column="BusPhone", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    homephone = models.CharField(
        db_column="HomePhone", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    faxno = models.CharField(
        db_column="FaxNo", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    mobileno = models.CharField(
        db_column="MobileNo", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    emailaddress = models.CharField(
        db_column="EMAILAddress", max_length=320, blank=True, null=True
    )  # Field name made lowercase.
    title = models.CharField(
        db_column="Title", max_length=5, blank=True, null=True
    )  # Field name made lowercase.
    surname = models.CharField(
        db_column="Surname", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    firstnames = models.CharField(
        db_column="FirstNames", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    notes = models.TextField(
        db_column="Notes", blank=True, null=True
    )  # Field name made lowercase. This field type is a guess.
    sentintroletter = models.BooleanField(
        db_column="SentIntroLetter", blank=True, null=True
    )  # Field name made lowercase.
    sentintroletterdate = models.DateTimeField(
        db_column="SentIntroLetterDate", blank=True, null=True
    )  # Field name made lowercase.
    sendemailupdates = models.BooleanField(
        db_column="SendEmailUpdates", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblContact"
        unique_together = (("contactno", "clientno"),)


class LegacyContractedparty(models.Model):
    contractedpartyid = models.AutoField(
        db_column="ContractedPartyID", primary_key=True
    )  # Field name made lowercase.
    cpname = models.CharField(
        db_column="CPName", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    addrtype = models.CharField(
        db_column="AddrType", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    addrsubno = models.CharField(
        db_column="AddrSubNo", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    addrnumber = models.CharField(
        db_column="AddrNumber", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    addrstreet = models.CharField(
        db_column="AddrStreet", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    addrstreettype = models.CharField(
        db_column="AddrStreetType", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    addrsuburb = models.CharField(
        db_column="AddrSuburb", max_length=25, blank=True, null=True
    )  # Field name made lowercase.
    addrstate = models.CharField(
        db_column="AddrState", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    addrpostcode = models.IntegerField(
        db_column="AddrPostCode", blank=True, null=True
    )  # Field name made lowercase.
    active = models.BooleanField(
        db_column="Active", blank=True, null=True
    )  # Field name made lowercase.
    abn = models.CharField(
        db_column="ABN", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    abnverified = models.BooleanField(
        db_column="ABNVerified", blank=True, null=True
    )  # Field name made lowercase.
    contacttitle = models.CharField(
        db_column="ContactTitle", max_length=5, blank=True, null=True
    )  # Field name made lowercase.
    contactfirstname = models.CharField(
        db_column="ContactFirstName", max_length=40, blank=True, null=True
    )  # Field name made lowercase.
    contactlastname = models.CharField(
        db_column="ContactLastName", max_length=40, blank=True, null=True
    )  # Field name made lowercase.
    contactphone = models.CharField(
        db_column="ContactPhone", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    contactmobile = models.CharField(
        db_column="ContactMobile", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    contactwork = models.CharField(
        db_column="ContactWork", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    contactfax = models.CharField(
        db_column="ContactFax", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    contactemail = models.CharField(
        db_column="ContactEmail", max_length=40, blank=True, null=True
    )  # Field name made lowercase.
    classification = models.IntegerField(
        db_column="Classification", blank=True, null=True
    )  # Field name made lowercase.
    agreementwithsx = models.BooleanField(
        db_column="AgreementWithSX", blank=True, null=True
    )  # Field name made lowercase.
    agreementdate = models.DateTimeField(
        db_column="AgreementDate", blank=True, null=True
    )  # Field name made lowercase.
    renewaldate = models.DateTimeField(
        db_column="RenewalDate", blank=True, null=True
    )  # Field name made lowercase.
    servicefee = models.FloatField(
        db_column="ServiceFee", blank=True, null=True
    )  # Field name made lowercase.
    marketinglevy = models.FloatField(
        db_column="MarketingLevy", blank=True, null=True
    )  # Field name made lowercase.
    monthlydepotfeepercar = models.FloatField(
        db_column="MonthlyDepotFeePerCar", blank=True, null=True
    )  # Field name made lowercase.
    bankacctname = models.CharField(
        db_column="BankAcctName", max_length=40, blank=True, null=True
    )  # Field name made lowercase.
    bankname = models.CharField(
        db_column="BankName", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    bankbsb = models.CharField(
        db_column="BankBSB", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    bankacctno = models.CharField(
        db_column="BankAcctNo", max_length=30, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblContractedParty"


class LegacyCreditaccount(models.Model):
    accountno = models.CharField(
        db_column="AccountNo", primary_key=True, max_length=10
    )  # Field name made lowercase.
    clientno = models.OneToOneField(
        "LegacyClient",
        models.DO_NOTHING,
        db_column="ClientNo",
        related_name="credit_account",
    )  # Field name made lowercase.
    clientabn = models.CharField(
        db_column="ClientABN", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    acctsto = models.CharField(
        db_column="AcctsTo", max_length=60
    )  # Field name made lowercase.
    accposition = models.CharField(
        db_column="AccPosition", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    phone = models.CharField(
        db_column="Phone", max_length=10
    )  # Field name made lowercase.
    fax = models.CharField(
        db_column="Fax", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    dept = models.CharField(
        db_column="Dept", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    addrtype = models.CharField(
        db_column="AddrType", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    addrsubno = models.CharField(
        db_column="AddrSubNo", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    addrnumber = models.CharField(
        db_column="AddrNumber", max_length=10
    )  # Field name made lowercase.
    addrstreet = models.CharField(
        db_column="AddrStreet", max_length=30
    )  # Field name made lowercase.
    addrstreettype = models.CharField(
        db_column="AddrStreetType", max_length=10
    )  # Field name made lowercase.
    addrsuburb = models.CharField(
        db_column="AddrSuburb", max_length=25
    )  # Field name made lowercase.
    addrstate = models.CharField(
        db_column="AddrState", max_length=10
    )  # Field name made lowercase.
    addrpcode = models.IntegerField(db_column="AddrPCode")  # Field name made lowercase.
    prefchargetype = models.CharField(
        db_column="PrefChargeType", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    fixcharge = models.IntegerField(
        db_column="FixCharge", blank=True, null=True
    )  # Field name made lowercase.
    timecharge = models.IntegerField(
        db_column="TimeCharge", blank=True, null=True
    )  # Field name made lowercase.
    distcharge = models.IntegerField(
        db_column="DistCharge", blank=True, null=True
    )  # Field name made lowercase.
    creditcardtype = models.CharField(
        db_column="CreditCardType", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    creditcardnumber = models.CharField(
        db_column="CreditCardNumber", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    creditcardexpirydate = models.CharField(
        db_column="CreditCardExpiryDate", max_length=5, blank=True, null=True
    )  # Field name made lowercase.
    creditcardnameoncard = models.CharField(
        db_column="CreditCardNameOnCard", max_length=25, blank=True, null=True
    )  # Field name made lowercase.
    accountapplicationformcompleted = models.CharField(
        db_column="AccountApplicationFormCompleted", max_length=1, blank=True, null=True
    )  # Field name made lowercase.
    completeddate = models.DateTimeField(
        db_column="CompletedDate", blank=True, null=True
    )  # Field name made lowercase.
    rateschedule = models.CharField(
        db_column="RateSchedule", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    emailaddress = models.CharField(
        db_column="EmailAddress", max_length=320, blank=True, null=True
    )  # Field name made lowercase.
    country = models.CharField(
        db_column="Country", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    tokenid = models.CharField(
        db_column="TokenId", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    signedccauth = models.CharField(
        db_column="SignedCCAuth", max_length=1, blank=True, null=True
    )  # Field name made lowercase.
    approvedby = models.CharField(
        db_column="ApprovedBy", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    currentpurchaseorder = models.CharField(
        db_column="CurrentPurchaseOrder", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    invoicingmethod = models.CharField(
        db_column="InvoicingMethod", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    title = models.CharField(
        db_column="Title", max_length=5, blank=True, null=True
    )  # Field name made lowercase.
    surname = models.CharField(
        db_column="Surname", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    firstnames = models.CharField(
        db_column="FirstNames", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    organisation = models.CharField(
        db_column="Organisation", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    mobile = models.CharField(
        db_column="Mobile", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    cardfee = models.DecimalField(
        db_column="CardFee", max_digits=10, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblCreditAccount"
        unique_together = (("accountno", "clientno"),)


class LegacyCreditcardtypes(models.Model):
    cardname = models.CharField(
        db_column="Cardname", primary_key=True, max_length=25
    )  # Field name made lowercase.
    surcharge = models.DecimalField(
        db_column="Surcharge", max_digits=18, decimal_places=0
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblCreditCardTypes"


class LegacyDespatch(models.Model):
    despatchno = models.AutoField(
        db_column="DespatchNo", primary_key=True
    )  # Field name made lowercase.
    jobnumber = models.IntegerField(
        db_column="JobNumber", blank=True, null=True
    )  # Field name made lowercase.
    driverno = models.IntegerField(
        db_column="DriverNo", blank=True, null=True
    )  # Field name made lowercase.
    despatchdate = models.DateTimeField(
        db_column="DespatchDate", blank=True, null=True
    )  # Field name made lowercase.
    response = models.CharField(
        db_column="Response", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    responsedate = models.DateTimeField(
        db_column="ResponseDate", blank=True, null=True
    )  # Field name made lowercase.
    details = models.TextField(
        db_column="Details", blank=True, null=True
    )  # Field name made lowercase. This field type is a guess.

    class Meta:
        managed = False
        db_table = "tblDespatch"


class LegacyDestinations(models.Model):
    jobnumber = models.ForeignKey(
        "LegacyBookings",
        models.DO_NOTHING,
        db_column="JobNumber",
        primary_key=True,
        related_name="destinations",
    )  # Field name made lowercase.
    clientno = models.ForeignKey(
        "LegacyClient", models.DO_NOTHING, db_column="ClientNo"
    )  # Field name made lowercase.
    destno = models.IntegerField(db_column="DestNo")  # Field name made lowercase.
    suburb = models.CharField(
        db_column="Suburb", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    postcode = models.IntegerField(
        db_column="PostCode", blank=True, null=True
    )  # Field name made lowercase.
    address = models.CharField(
        db_column="Address", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    location = models.CharField(
        db_column="Location", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    instructions = models.CharField(
        db_column="Instructions", max_length=250, blank=True, null=True
    )  # Field name made lowercase.
    phone = models.CharField(
        db_column="Phone", max_length=15, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblDestinations"
        unique_together = (("jobnumber", "clientno", "destno"),)


class LegacyDestinationsv(models.Model):
    jobnumber = models.IntegerField(
        db_column="JobNumber", primary_key=True
    )  # Field name made lowercase.
    clientno = models.IntegerField(db_column="ClientNo")  # Field name made lowercase.
    destno = models.IntegerField(db_column="DestNo")  # Field name made lowercase.
    versionstamp = models.CharField(
        db_column="VersionStamp", max_length=16
    )  # Field name made lowercase.
    suburb = models.CharField(
        db_column="Suburb", max_length=25, blank=True, null=True
    )  # Field name made lowercase.
    postcode = models.IntegerField(
        db_column="PostCode", blank=True, null=True
    )  # Field name made lowercase.
    address = models.CharField(
        db_column="Address", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    location = models.CharField(
        db_column="Location", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    instructions = models.CharField(
        db_column="Instructions", max_length=250, blank=True, null=True
    )  # Field name made lowercase.
    phone = models.CharField(
        db_column="Phone", max_length=15, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblDestinationsV"
        unique_together = (("jobnumber", "clientno", "destno", "versionstamp"),)


class LegacyDriver(models.Model):
    driverno = models.IntegerField(
        db_column="DriverNo", primary_key=True
    )  # Field name made lowercase.
    drivername = models.CharField(
        db_column="DriverName", max_length=50
    )  # Field name made lowercase.
    dob = models.DateTimeField(db_column="DOB")  # Field name made lowercase.
    addrtype = models.CharField(
        db_column="AddrType", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    addrsubno = models.CharField(
        db_column="AddrSubNo", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    addrnumber = models.CharField(
        db_column="AddrNumber", max_length=10
    )  # Field name made lowercase.
    addrstreet = models.CharField(
        db_column="AddrStreet", max_length=30
    )  # Field name made lowercase.
    addrstreettype = models.CharField(
        db_column="AddrStreetType", max_length=10
    )  # Field name made lowercase.
    addrsuburb = models.CharField(
        db_column="AddrSuburb", max_length=25
    )  # Field name made lowercase.
    addrstate = models.CharField(
        db_column="AddrState", max_length=10
    )  # Field name made lowercase.
    addrpostcode = models.IntegerField(
        db_column="AddrPostCode"
    )  # Field name made lowercase.
    homeph = models.CharField(
        db_column="HomePh", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    mobileph = models.CharField(
        db_column="MobilePh", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    faxno = models.CharField(
        db_column="FaxNo", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    partnername = models.CharField(
        db_column="PartnerName", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    partnerph = models.CharField(
        db_column="PartnerPh", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    commissionrate = models.IntegerField(
        db_column="CommissionRate", blank=True, null=True
    )  # Field name made lowercase.
    capacity = models.CharField(
        db_column="Capacity", max_length=1
    )  # Field name made lowercase.
    drvagreesigned = models.SmallIntegerField(
        db_column="DrvAgreeSigned", blank=True, null=True
    )  # Field name made lowercase.
    startdate = models.DateTimeField(
        db_column="StartDate", blank=True, null=True
    )  # Field name made lowercase.
    terminationdate = models.DateTimeField(
        db_column="TerminationDate", blank=True, null=True
    )  # Field name made lowercase.
    abn = models.CharField(
        db_column="ABN", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    radioserialno = models.CharField(
        db_column="RadioSerialNo", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    dlno = models.CharField(
        db_column="DLNo", max_length=10
    )  # Field name made lowercase.
    dlexpdate = models.DateTimeField(
        db_column="DLExpDate", blank=True, null=True
    )  # Field name made lowercase.
    dcno = models.CharField(
        db_column="DCNo", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    dcexpdate = models.DateTimeField(
        db_column="DCExpDate", blank=True, null=True
    )  # Field name made lowercase.
    carno = models.CharField(
        db_column="CarNo", max_length=6, blank=True, null=True
    )  # Field name made lowercase.
    chqname = models.CharField(
        db_column="ChqName", max_length=40, blank=True, null=True
    )  # Field name made lowercase.
    chqaddr = models.CharField(
        db_column="ChqAddr", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    chqsuburb = models.CharField(
        db_column="ChqSuburb", max_length=25, blank=True, null=True
    )  # Field name made lowercase.
    chqstate = models.CharField(
        db_column="ChqState", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    chqpcode = models.IntegerField(
        db_column="ChqPCode", blank=True, null=True
    )  # Field name made lowercase.
    chqphone = models.CharField(
        db_column="ChqPhone", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    chqabn = models.CharField(
        db_column="ChqABN", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    deductradio = models.DecimalField(
        db_column="DeductRadio", max_digits=10, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.
    deductother1 = models.DecimalField(
        db_column="DeductOther1", max_digits=10, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.
    deductother2 = models.DecimalField(
        db_column="DeductOther2", max_digits=10, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.
    active = models.CharField(
        db_column="Active", max_length=1
    )  # Field name made lowercase.
    firstname = models.CharField(
        db_column="FirstName", max_length=40, blank=True, null=True
    )  # Field name made lowercase.
    lastname = models.CharField(
        db_column="LastName", max_length=40, blank=True, null=True
    )  # Field name made lowercase.
    emailaddress = models.CharField(
        db_column="EmailAddress", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    isfemale = models.BooleanField(
        db_column="IsFemale", blank=True, null=True
    )  # Field name made lowercase.
    issmoker = models.BooleanField(
        db_column="IsSmoker", blank=True, null=True
    )  # Field name made lowercase.
    ishilevel = models.BooleanField(
        db_column="IsHiLevel", blank=True, null=True
    )  # Field name made lowercase.
    opmanualno = models.CharField(
        db_column="OpManualNo", max_length=40, blank=True, null=True
    )  # Field name made lowercase.
    opmanualversion = models.CharField(
        db_column="OpManualVersion", max_length=8, blank=True, null=True
    )  # Field name made lowercase.
    opmanualissuedate = models.DateTimeField(
        db_column="OpManualIssueDate", blank=True, null=True
    )  # Field name made lowercase.
    opmanualreturndate = models.DateTimeField(
        db_column="OpManualReturnDate", blank=True, null=True
    )  # Field name made lowercase.
    despatchemail = models.CharField(
        db_column="DespatchEmail", max_length=100, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblDriver"


class LegacyDriverdaysworked(models.Model):
    driverno = models.IntegerField(
        db_column="DriverNo", blank=True, null=True
    )  # Field name made lowercase.
    daysworked = models.IntegerField(
        db_column="DaysWorked", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblDriverDaysWorked"


class LegacyDrivernote(models.Model):
    noteid = models.IntegerField(
        db_column="NoteID", primary_key=True
    )  # Field name made lowercase.
    driverno = models.ForeignKey(
        LegacyDriver, models.DO_NOTHING, db_column="DriverNo"
    )  # Field name made lowercase.
    dateraised = models.DateTimeField(
        db_column="DateRaised"
    )  # Field name made lowercase.
    raisedby = models.CharField(
        db_column="RaisedBy", max_length=20
    )  # Field name made lowercase.
    details = models.CharField(
        db_column="Details", max_length=255
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblDriverNote"
        unique_together = (("noteid", "driverno"),)


class LegacyDriverRequest(models.Model):
    driverrequestid = models.AutoField(
        db_column="DriverRequestId", primary_key=True
    )  # Field name made lowercase.
    displayname = models.CharField(
        db_column="DisplayName", max_length=25
    )  # Field name made lowercase.
    abbreviation = models.CharField(
        db_column="Abbreviation", max_length=9
    )  # Field name made lowercase.
    orderid = models.IntegerField(db_column="OrderID")  # Field name made lowercase.
    isactive = models.BooleanField(db_column="IsActive")  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblDriverRequest"


class LegacyEquipment(models.Model):
    equipmentid = models.AutoField(
        db_column="EquipmentId", primary_key=True
    )  # Field name made lowercase.
    displayname = models.CharField(
        db_column="DisplayName", max_length=25
    )  # Field name made lowercase.
    abbreviation = models.CharField(
        db_column="Abbreviation", max_length=8
    )  # Field name made lowercase.
    orderid = models.IntegerField(db_column="OrderID")  # Field name made lowercase.
    isactive = models.BooleanField(db_column="IsActive")  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblEquipment"


class LegacyFrequentdestinations(models.Model):
    clientno = models.ForeignKey(
        "LegacyClient", models.DO_NOTHING, db_column="ClientNo", primary_key=True
    )  # Field name made lowercase.
    seqno = models.IntegerField(db_column="SeqNo")  # Field name made lowercase.
    suburb = models.CharField(
        db_column="Suburb", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    pcode = models.IntegerField(
        db_column="PCode", blank=True, null=True
    )  # Field name made lowercase.
    address = models.CharField(
        db_column="Address", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    location = models.CharField(
        db_column="Location", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    phone = models.CharField(
        db_column="Phone", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    instructions = models.CharField(
        db_column="Instructions", max_length=250, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblFrequentDestinations"
        unique_together = (("clientno", "seqno"),)


class LegacyFrequentpickups(models.Model):
    clientno = models.ForeignKey(
        "LegacyClient", models.DO_NOTHING, db_column="ClientNo", primary_key=True
    )  # Field name made lowercase.
    seqno = models.IntegerField(db_column="SeqNo")  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=25
    )  # Field name made lowercase.
    suburb = models.CharField(
        db_column="Suburb", max_length=50
    )  # Field name made lowercase.
    pcode = models.IntegerField(
        db_column="PCode", blank=True, null=True
    )  # Field name made lowercase.
    address = models.CharField(
        db_column="Address", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    location = models.CharField(
        db_column="Location", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    phone = models.CharField(
        db_column="Phone", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    instructions = models.CharField(
        db_column="Instructions", max_length=250, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblFrequentPickups"
        unique_together = (("clientno", "seqno"),)


class LegacyJobsreport(models.Model):
    jobnumber = models.IntegerField(
        db_column="JobNumber", blank=True, null=True
    )  # Field name made lowercase.
    clientno = models.IntegerField(
        db_column="ClientNo", blank=True, null=True
    )  # Field name made lowercase.
    clientname = models.CharField(
        db_column="ClientName", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    daterequired = models.CharField(
        db_column="DateRequired", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    timerequired = models.CharField(
        db_column="TimeRequired", max_length=4, blank=True, null=True
    )  # Field name made lowercase.
    carno = models.CharField(
        db_column="CarNo", max_length=6, blank=True, null=True
    )  # Field name made lowercase.
    runno = models.IntegerField(
        db_column="RunNo", blank=True, null=True
    )  # Field name made lowercase.
    status = models.CharField(
        db_column="Status", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    driverno = models.IntegerField(
        db_column="DriverNo", blank=True, null=True
    )  # Field name made lowercase.
    carposn = models.IntegerField(
        db_column="CarPosn", blank=True, null=True
    )  # Field name made lowercase.
    carcount = models.IntegerField(
        db_column="CarCount", blank=True, null=True
    )  # Field name made lowercase.
    bookingtype = models.CharField(
        db_column="BookingType", max_length=1, blank=True, null=True
    )  # Field name made lowercase.
    paymentmethod = models.CharField(
        db_column="PaymentMethod", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    cartype = models.CharField(
        db_column="CarType", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    pickupname = models.CharField(
        db_column="PickupName", max_length=100, blank=True, null=True
    )  # Field name made lowercase.
    firstpickup = models.CharField(
        db_column="FirstPickup", max_length=129, blank=True, null=True
    )  # Field name made lowercase.
    lastdestination = models.CharField(
        db_column="LastDestination", max_length=135, blank=True, null=True
    )  # Field name made lowercase.
    clientphone = models.CharField(
        db_column="ClientPhone", max_length=50, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblJobsReport"


class LegacyKnockbackreasons(models.Model):
    reason = models.CharField(
        db_column="Reason", primary_key=True, max_length=50
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblKnockbackReasons"


class LegacyKnockbacks(models.Model):
    knockbackid = models.AutoField(
        db_column="KnockBackID", primary_key=True
    )  # Field name made lowercase.
    jobid = models.IntegerField(db_column="JobID")  # Field name made lowercase.
    driverno = models.IntegerField(db_column="DriverNo")  # Field name made lowercase.
    jobdate = models.DateTimeField(db_column="JobDate")  # Field name made lowercase.
    jobtime = models.CharField(
        db_column="JobTime", max_length=4
    )  # Field name made lowercase.
    passenger = models.CharField(
        db_column="Passenger", max_length=30
    )  # Field name made lowercase.
    pickup = models.CharField(
        db_column="Pickup", max_length=100
    )  # Field name made lowercase.
    destination = models.CharField(
        db_column="Destination", max_length=100
    )  # Field name made lowercase.
    knockback = models.CharField(
        db_column="Knockback", max_length=255
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblKnockbacks"
        unique_together = (("knockbackid", "driverno", "jobid"),)


class LegacyMessageids(models.Model):
    messageid = models.AutoField(
        db_column="MessageId", primary_key=True
    )  # Field name made lowercase.
    jobnumber = models.IntegerField(db_column="JobNumber")  # Field name made lowercase.
    remindermessageid = models.CharField(
        db_column="ReminderMessageId", max_length=36
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblMessageIds"


class LegacyNote(models.Model):
    noteno = models.AutoField(
        db_column="NoteNo", primary_key=True
    )  # Field name made lowercase.
    clientno = models.IntegerField(
        db_column="ClientNo", blank=True, null=True
    )  # Field name made lowercase.
    date = models.DateTimeField(
        db_column="Date", blank=True, null=True
    )  # Field name made lowercase.
    note = models.TextField(
        db_column="Note", blank=True, null=True
    )  # Field name made lowercase. This field type is a guess.
    operatorid = models.CharField(
        db_column="OperatorId", max_length=20, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblNote"


class LegacyParams(models.Model):
    paramno = models.AutoField(
        db_column="ParamNo", primary_key=True
    )  # Field name made lowercase.
    description = models.CharField(
        db_column="Description", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    numericvalue = models.FloatField(
        db_column="NumericValue", blank=True, null=True
    )  # Field name made lowercase.
    datevalue = models.DateTimeField(
        db_column="DateValue", blank=True, null=True
    )  # Field name made lowercase.
    textvalue = models.CharField(
        db_column="TextValue", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblParams"


class LegacyPaytype(models.Model):
    paytype = models.CharField(
        db_column="PayType", primary_key=True, max_length=1
    )  # Field name made lowercase.
    paydesc = models.CharField(
        db_column="PayDesc", max_length=20
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblPayType"


class LegacyPayment(models.Model):
    paymentno = models.AutoField(
        db_column="PaymentNo", primary_key=True
    )  # Field name made lowercase.
    clientno = models.IntegerField(
        db_column="ClientNo", blank=True, null=True
    )  # Field name made lowercase.
    invoiceno = models.IntegerField(
        db_column="InvoiceNo", blank=True, null=True
    )  # Field name made lowercase.
    jobnumber = models.IntegerField(
        db_column="JobNumber", blank=True, null=True
    )  # Field name made lowercase.
    date = models.DateTimeField(
        db_column="Date", blank=True, null=True
    )  # Field name made lowercase.
    totalamount = models.DecimalField(
        db_column="TotalAmount", max_digits=19, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.
    gstamount = models.DecimalField(
        db_column="GSTAmount", max_digits=19, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.
    creditcardsurcharge = models.DecimalField(
        db_column="CreditCardSurcharge",
        max_digits=19,
        decimal_places=4,
        blank=True,
        null=True,
    )  # Field name made lowercase.
    paymentmethod = models.CharField(
        db_column="PaymentMethod", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    operatorid = models.CharField(
        db_column="OperatorId", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    paymenttype = models.CharField(
        db_column="PaymentType", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    month = models.SmallIntegerField(
        db_column="Month", blank=True, null=True
    )  # Field name made lowercase.
    year = models.SmallIntegerField(
        db_column="Year", blank=True, null=True
    )  # Field name made lowercase.
    ewayauthcode = models.CharField(
        db_column="eWayAuthCode", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    ewaytrxnstatus = models.CharField(
        db_column="eWayTrxnStatus", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    ewaytrxnerror = models.CharField(
        db_column="eWayTrxnError", max_length=100, blank=True, null=True
    )  # Field name made lowercase.
    ewaytrxnnumber = models.CharField(
        db_column="eWayTrxnNumber", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    ewayreturnamount = models.CharField(
        db_column="eWayReturnAmount", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    daterequired = models.CharField(
        db_column="DateRequired", max_length=10, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblPayment"


class LegacyPaymentMethod(models.Model):
    method = models.CharField(
        db_column="Method", primary_key=True, max_length=35
    )  # Field name made lowercase.
    forbooking = models.IntegerField(
        db_column="ForBooking", blank=True, null=True
    )  # Field name made lowercase.
    abbrev = models.CharField(
        db_column="Abbrev", max_length=5, blank=True, null=True
    )  # Field name made lowercase.
    displayname = models.CharField(
        db_column="DisplayName", max_length=30
    )  # Field name made lowercase.
    orderid = models.IntegerField(db_column="OrderID")  # Field name made lowercase.
    isactive = models.BooleanField(db_column="IsActive")  # Field name made lowercase.
    isdefault = models.BooleanField(db_column="IsDefault")  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblPaymentMethod"


class LegacyPickups(models.Model):
    jobnumber = models.ForeignKey(
        LegacyBookings,
        models.DO_NOTHING,
        db_column="JobNumber",
        primary_key=True,
        related_name="pickups",
    )  # Field name made lowercase.
    clientno = models.ForeignKey(
        LegacyClient, models.DO_NOTHING, db_column="ClientNo", related_name="pickups"
    )  # Field name made lowercase.
    pickupno = models.IntegerField(db_column="PickupNo")  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=100
    )  # Field name made lowercase.
    suburb = models.CharField(
        db_column="Suburb", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    postcode = models.IntegerField(
        db_column="PostCode", blank=True, null=True
    )  # Field name made lowercase.
    address = models.CharField(
        db_column="Address", max_length=50
    )  # Field name made lowercase.
    location = models.CharField(
        db_column="Location", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    phone = models.CharField(
        db_column="Phone", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    instructions = models.CharField(
        db_column="Instructions", max_length=250, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblPickups"
        unique_together = (("jobnumber", "clientno", "pickupno"),)


class LegacyPickupV(models.Model):
    jobnumber = models.IntegerField(
        db_column="JobNumber", primary_key=True
    )  # Field name made lowercase.
    clientno = models.IntegerField(db_column="ClientNo")  # Field name made lowercase.
    pickupno = models.IntegerField(db_column="PickupNo")  # Field name made lowercase.
    versionstamp = models.CharField(
        db_column="VersionStamp", max_length=16
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=100
    )  # Field name made lowercase.
    suburb = models.CharField(
        db_column="Suburb", max_length=25
    )  # Field name made lowercase.
    postcode = models.IntegerField(
        db_column="PostCode", blank=True, null=True
    )  # Field name made lowercase.
    address = models.CharField(
        db_column="Address", max_length=50
    )  # Field name made lowercase.
    location = models.CharField(
        db_column="Location", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    phone = models.CharField(
        db_column="Phone", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    instructions = models.CharField(
        db_column="Instructions", max_length=250, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblPickupsV"
        unique_together = (("jobnumber", "clientno", "pickupno", "versionstamp"),)


class LegacyPostcodes(models.Model):
    pcode = models.CharField(
        db_column="Pcode", max_length=4
    )  # Field name made lowercase.
    locality = models.CharField(
        db_column="Locality", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    state = models.CharField(
        db_column="State", max_length=3, blank=True, null=True
    )  # Field name made lowercase.
    visible = models.BooleanField(db_column="Visible")  # Field name made lowercase.
    sort = models.IntegerField(
        db_column="Sort", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblPostcodes"


class LegacyRateSchedule(models.Model):
    ratescheduleid = models.IntegerField(
        db_column="RateScheduleID", primary_key=True
    )  # Field name made lowercase.
    rateschedule = models.CharField(
        db_column="RateSchedule", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    displayname = models.CharField(
        db_column="DisplayName", max_length=30
    )  # Field name made lowercase.
    abbreviation = models.CharField(
        db_column="Abbreviation", max_length=5
    )  # Field name made lowercase.
    orderid = models.IntegerField(db_column="OrderID")  # Field name made lowercase.
    isactive = models.BooleanField(db_column="IsActive")  # Field name made lowercase.
    isdefault = models.BooleanField(db_column="IsDefault")  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblRateSchedule"


class LegacyStatus(models.Model):
    statusid = models.AutoField(
        db_column="StatusId", primary_key=True
    )  # Field name made lowercase.
    displayname = models.CharField(
        db_column="DisplayName", max_length=10
    )  # Field name made lowercase.
    abbreviation = models.CharField(
        db_column="Abbreviation", max_length=3
    )  # Field name made lowercase.
    orderid = models.IntegerField(db_column="OrderID")  # Field name made lowercase.
    isactive = models.BooleanField(db_column="IsActive")  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblStatus"


class LegacyStreetAbbreviations(models.Model):
    abbreviation = models.CharField(
        db_column="Abbreviation", primary_key=True, max_length=4
    )  # Field name made lowercase.
    fullwording = models.CharField(
        db_column="FullWording", max_length=20
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblStreetAbbreviations"


class LegacySysParams(models.Model):
    nextjobnumber = models.IntegerField(
        db_column="NextJobNumber"
    )  # Field name made lowercase.
    nextinvoicenumber = models.IntegerField(
        db_column="NextInvoiceNumber"
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblSysParams"


class LegacyTaxInvoiceBookings(models.Model):
    invoiceid = models.ForeignKey(
        "LegacyTaxInvoices", models.DO_NOTHING, db_column="InvoiceId"
    )  # Field name made lowercase.
    jobnumber = models.ForeignKey(
        LegacyBookings, models.DO_NOTHING, db_column="JobNumber"
    )  # Field name made lowercase.
    clientno = models.ForeignKey(
        LegacyBookings, models.DO_NOTHING, db_column="ClientNo", related_name="+"
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblTaxInvoiceBookings"


class LegacyTaxInvoiceData(models.Model):
    clientno = models.IntegerField(db_column="ClientNo")  # Field name made lowercase.
    title = models.CharField(
        db_column="Title", max_length=5, blank=True, null=True
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=50
    )  # Field name made lowercase.
    accountno = models.CharField(
        db_column="AccountNo", max_length=10
    )  # Field name made lowercase.
    refno = models.CharField(
        db_column="RefNo", max_length=15, blank=True, null=True
    )  # Field name made lowercase.
    category = models.CharField(
        db_column="Category", max_length=1, blank=True, null=True
    )  # Field name made lowercase.
    status = models.CharField(
        db_column="Status", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    addrtype = models.CharField(
        db_column="AddrType", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    addrsubno = models.CharField(
        db_column="AddrSubNo", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    addrnumber = models.CharField(
        db_column="AddrNumber", max_length=10
    )  # Field name made lowercase.
    addrstreet = models.CharField(
        db_column="AddrStreet", max_length=30
    )  # Field name made lowercase.
    addrstreettype = models.CharField(
        db_column="AddrStreetType", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    addrsuburb = models.CharField(
        db_column="AddrSuburb", max_length=25
    )  # Field name made lowercase.
    addrstate = models.CharField(
        db_column="AddrState", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    addrpostcode = models.IntegerField(
        db_column="AddrPostCode", blank=True, null=True
    )  # Field name made lowercase.
    jobnumber = models.IntegerField(db_column="JobNumber")  # Field name made lowercase.
    daterequired = models.CharField(
        db_column="DateRequired", max_length=8
    )  # Field name made lowercase.
    timerequired = models.CharField(
        db_column="TimeRequired", max_length=4
    )  # Field name made lowercase.
    bookingcontactname = models.CharField(
        db_column="BookingContactName", max_length=25
    )  # Field name made lowercase.
    bookingcontactphone = models.CharField(
        db_column="BookingContactPhone", max_length=40, blank=True, null=True
    )  # Field name made lowercase.
    paymentmethod = models.CharField(
        db_column="PaymentMethod", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    bookingtype = models.CharField(
        db_column="BookingType", max_length=1, blank=True, null=True
    )  # Field name made lowercase.
    bookingstatus = models.CharField(
        db_column="BookingStatus", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    tripcharge = models.DecimalField(
        db_column="TripCharge", max_digits=10, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.
    authwaitingcharge = models.DecimalField(
        db_column="AuthWaitingCharge",
        max_digits=10,
        decimal_places=4,
        blank=True,
        null=True,
    )  # Field name made lowercase.
    extras = models.DecimalField(
        db_column="Extras", max_digits=10, decimal_places=4, blank=True, null=True
    )  # Field name made lowercase.
    totaltripcharge = models.DecimalField(
        db_column="TotalTripCharge",
        max_digits=10,
        decimal_places=4,
        blank=True,
        null=True,
    )  # Field name made lowercase.
    customerprice = models.DecimalField(
        db_column="CustomerPrice",
        max_digits=10,
        decimal_places=4,
        blank=True,
        null=True,
    )  # Field name made lowercase.
    driverscommission = models.DecimalField(
        db_column="DriversCommission",
        max_digits=10,
        decimal_places=4,
        blank=True,
        null=True,
    )  # Field name made lowercase.
    pickuptime = models.CharField(
        db_column="PickupTime", max_length=4, blank=True, null=True
    )  # Field name made lowercase.
    droptime = models.CharField(
        db_column="DropTime", max_length=4, blank=True, null=True
    )  # Field name made lowercase.
    totaltime = models.CharField(
        db_column="TotalTime", max_length=4, blank=True, null=True
    )  # Field name made lowercase.
    kilometers = models.CharField(
        db_column="Kilometers", max_length=4, blank=True, null=True
    )  # Field name made lowercase.
    categoryname = models.CharField(
        db_column="CategoryName", max_length=40, blank=True, null=True
    )  # Field name made lowercase.
    special = models.CharField(
        db_column="Special", max_length=4, blank=True, null=True
    )  # Field name made lowercase.
    contactname = models.CharField(
        db_column="ContactName", max_length=60, blank=True, null=True
    )  # Field name made lowercase.
    contactposn = models.CharField(
        db_column="ContactPosn", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    contactdept = models.CharField(
        db_column="ContactDept", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    destsuburb = models.CharField(
        db_column="DestSuburb", max_length=30
    )  # Field name made lowercase.
    destpostcode = models.IntegerField(
        db_column="DestPostCode", blank=True, null=True
    )  # Field name made lowercase.
    destaddress = models.CharField(
        db_column="DestAddress", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    destlocation = models.CharField(
        db_column="DestLocation", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    pickupname = models.CharField(
        db_column="PickupName", max_length=100
    )  # Field name made lowercase.
    pickupsuburb = models.CharField(
        db_column="PickupSuburb", max_length=30
    )  # Field name made lowercase.
    pickuppostcode = models.IntegerField(
        db_column="PickupPostCode"
    )  # Field name made lowercase.
    pickupaddress = models.CharField(
        db_column="PickupAddress", max_length=50
    )  # Field name made lowercase.
    pickuplocation = models.CharField(
        db_column="PickupLocation", max_length=50
    )  # Field name made lowercase.
    invoiceno = models.IntegerField(db_column="InvoiceNo")  # Field name made lowercase.
    cartype = models.CharField(
        db_column="CarType", max_length=10, blank=True, null=True
    )  # Field name made lowercase.
    cardriverequip = models.DecimalField(
        db_column="CarDriverEquip",
        max_digits=10,
        decimal_places=4,
        blank=True,
        null=True,
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblTaxInvoiceData"


class LegacyTaxInvoices(models.Model):
    taxinvoiceno = models.AutoField(
        db_column="TaxInvoiceNo", primary_key=True
    )  # Field name made lowercase.
    created = models.DateTimeField(db_column="Created")  # Field name made lowercase.
    emailed = models.DateTimeField(
        db_column="Emailed", blank=True, null=True
    )  # Field name made lowercase.
    emailedto = models.CharField(
        db_column="EmailedTo", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    paymentmethod = models.CharField(
        db_column="PaymentMethod", max_length=20
    )  # Field name made lowercase.
    applicabilitystart = models.CharField(
        db_column="ApplicabilityStart", max_length=10
    )  # Field name made lowercase.
    applicabilityend = models.CharField(
        db_column="ApplicabilityEnd", max_length=10
    )  # Field name made lowercase.
    adhocamount = models.FloatField(
        db_column="AdhocAmount", blank=True, null=True
    )  # Field name made lowercase.
    adhocgst = models.FloatField(
        db_column="AdhocGst", blank=True, null=True
    )  # Field name made lowercase.
    adhocsurcharge = models.FloatField(
        db_column="AdhocSurcharge", blank=True, null=True
    )  # Field name made lowercase.
    comments = models.TextField(
        db_column="Comments", blank=True, null=True
    )  # Field name made lowercase. This field type is a guess.

    class Meta:
        managed = False
        db_table = "tblTaxInvoices"


class LegacyTitles(models.Model):
    title = models.CharField(
        db_column="Title", primary_key=True, max_length=5
    )  # Field name made lowercase.
    orderid = models.IntegerField(
        db_column="OrderID", blank=True, null=True
    )  # Field name made lowercase.
    isclient = models.BooleanField(
        db_column="IsClient", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblTitles"


class LegacyUpdateReasons(models.Model):
    screen = models.CharField(
        db_column="Screen", max_length=25
    )  # Field name made lowercase.
    updordelreason = models.CharField(
        db_column="UpdOrDelReason", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    updordelperson = models.CharField(
        db_column="UpdOrDelPerson", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    updordeldate = models.DateTimeField(
        db_column="UpdOrDelDate", blank=True, null=True
    )  # Field name made lowercase.
    jobno = models.IntegerField(
        db_column="JobNo", blank=True, null=True
    )  # Field name made lowercase.
    clientno = models.IntegerField(
        db_column="ClientNo", blank=True, null=True
    )  # Field name made lowercase.
    accountno = models.CharField(
        db_column="AccountNo", max_length=50, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblUpdateReasons"


class LegacyUsers(models.Model):
    operatorid = models.CharField(
        db_column="OperatorId", primary_key=True, max_length=20
    )  # Field name made lowercase.
    password = models.CharField(
        db_column="Password", max_length=10
    )  # Field name made lowercase.
    loggedin = models.SmallIntegerField(
        db_column="LoggedIn", blank=True, null=True
    )  # Field name made lowercase.
    lastlogindate = models.DateTimeField(
        db_column="LastLoginDate", blank=True, null=True
    )  # Field name made lowercase.
    computer = models.CharField(
        db_column="Computer", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    isadmin = models.BooleanField(db_column="IsAdmin")  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "tblUsers"
